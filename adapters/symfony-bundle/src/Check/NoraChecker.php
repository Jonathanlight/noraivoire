<?php

// NoraIvoire — exécution de `nora check` depuis Symfony. © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Check;

use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * Délègue la validation au CLI NoraIvoire (une seule implémentation des règles,
 * partagée avec npm run check, l'éditeur et la CI).
 *
 * Sécurité :
 *  - Process reçoit un TABLEAU d'arguments : aucun shell, aucune interpolation ;
 *  - chaque chemin est résolu (realpath) et doit rester DANS le projet ;
 *  - les chemins transmis sont absolus : ils ne peuvent pas être lus comme des options (--format=…) ;
 *  - NODE_OPTIONS est retiré de l'environnement du processus enfant ;
 *  - durée bornée (timeout) et sortie JSON validée avant usage.
 */
final class NoraChecker
{
    public function __construct(
        private readonly string $projectDir,
        private readonly string $nodeBinary,
        private readonly ?string $cliPath,
        private readonly string $manifestPath,
        private readonly int $timeout = 60,
    ) {
    }

    /**
     * @param list<string> $paths chemins relatifs au projet (ou absolus, dans le projet)
     *
     * @return array{files: int, errors: int, warnings: int, issues: list<array{file: string, line: int, level: string, rule: string, message: string, fix?: string}>}
     */
    public function check(array $paths): array
    {
        if ($paths === []) {
            throw new NoraCheckException('Aucun chemin à analyser.');
        }
        if (!is_file($this->manifestPath)) {
            throw new NoraCheckException(\sprintf('Manifest NoraIvoire introuvable (%s) : lancez « npm run build && npm run symfony:sync ».', $this->manifestPath));
        }
        $args = [$this->resolveNode(), $this->resolveCli(), 'check', '--format=json', '--manifest='.$this->manifestPath];
        foreach ($paths as $path) {
            $args[] = $this->resolvePath($path);
        }

        $process = new Process($args, $this->projectDir, ['NODE_OPTIONS' => false], null, (float) $this->timeout);
        $process->run();
        // Code 0 : aucun problème ; 1 : erreurs trouvées. Tout autre code est une panne du CLI.
        if (!\in_array($process->getExitCode(), [0, 1], true)) {
            throw new NoraCheckException(\sprintf('nora check a échoué (code %s) : %s', (string) $process->getExitCode(), mb_substr(trim($process->getErrorOutput()), 0, 500)));
        }

        try {
            $report = json_decode($process->getOutput(), true, 16, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new NoraCheckException('Sortie JSON de nora check illisible.', 0, $e);
        }
        if (!\is_array($report) || !\is_int($report['files'] ?? null) || !\is_array($report['issues'] ?? null)) {
            throw new NoraCheckException('Sortie de nora check inattendue.');
        }

        /** @var array{files: int, errors: int, warnings: int, issues: list<array{file: string, line: int, level: string, rule: string, message: string, fix?: string}>} $report */
        return $report;
    }

    public function resolvePath(string $path): string
    {
        if ($path === '' || str_contains($path, "\0")) {
            throw new NoraCheckException('Chemin vide ou invalide.');
        }
        $candidate = $this->isAbsolute($path) ? $path : $this->projectDir.\DIRECTORY_SEPARATOR.$path;
        $real = realpath($candidate);
        $root = realpath($this->projectDir);
        if ($real === false || $root === false) {
            throw new NoraCheckException(\sprintf('Chemin introuvable : %s', $path));
        }
        if ($real !== $root && !str_starts_with($real, rtrim($root, \DIRECTORY_SEPARATOR).\DIRECTORY_SEPARATOR)) {
            throw new NoraCheckException(\sprintf('Chemin refusé, hors du projet : %s', $path));
        }

        return $real;
    }

    private function resolveNode(): string
    {
        $node = $this->nodeBinary;
        if ($this->isAbsolute($node)) {
            if (!is_file($node) || !is_executable($node)) {
                throw new NoraCheckException(\sprintf('Exécutable Node.js introuvable : %s', $node));
            }

            return $node;
        }
        if (!preg_match('/^[A-Za-z0-9._-]+$/', $node)) {
            throw new NoraCheckException('noraivoire.node_binary doit être un nom d\'exécutable ou un chemin absolu.');
        }
        $found = (new ExecutableFinder())->find($node);
        if ($found === null) {
            throw new NoraCheckException(\sprintf('Node.js (%s) introuvable dans le PATH : nora:check en a besoin (outil de développement, pas de production).', $node));
        }

        return $found;
    }

    private function resolveCli(): string
    {
        $cli = $this->cliPath ?? $this->projectDir.'/node_modules/@noraivoire/cli/src/cli.js';
        $real = realpath($cli);
        if ($real === false || !is_file($real) || !str_ends_with($real, '.js')) {
            throw new NoraCheckException(\sprintf('CLI NoraIvoire introuvable (%s) : installez @noraivoire/cli ou réglez noraivoire.cli_path.', $cli));
        }

        return $real;
    }

    private function isAbsolute(string $path): bool
    {
        return str_starts_with($path, '/') || (bool) preg_match('#^[A-Za-z]:[\\\\/]#', $path);
    }
}

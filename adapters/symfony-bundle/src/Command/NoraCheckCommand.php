<?php

// NoraIvoire — commande bin/console nora:check. © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Command;

use NoraIvoire\SymfonyBundle\Check\NoraChecker;
use NoraIvoire\SymfonyBundle\Check\NoraCheckException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'nora:check', description: 'Valide les templates Twig avec les règles NoraIvoire (nora check).')]
final class NoraCheckCommand extends Command
{
    private const FORMATS = ['text', 'json'];

    /**
     * @param list<string> $defaultPaths
     */
    public function __construct(
        private readonly NoraChecker $checker,
        private readonly array $defaultPaths = ['templates'],
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('paths', InputArgument::IS_ARRAY | InputArgument::OPTIONAL, 'Fichiers ou dossiers à analyser, dans le projet (défaut : noraivoire.check_paths).')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'Format de sortie : text ou json.', 'text');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $format = $input->getOption('format');
        if (!\is_string($format) || !\in_array($format, self::FORMATS, true)) {
            $io->error('Format inconnu : utilisez --format=text ou --format=json.');

            return Command::INVALID;
        }
        /** @var list<string> $paths */
        $paths = $input->getArgument('paths') ?: $this->defaultPaths;

        try {
            $report = $this->checker->check($paths);
        } catch (NoraCheckException $e) {
            $io->error(OutputFormatter::escape($e->getMessage()));

            return Command::FAILURE;
        }

        $errors = \count(array_filter($report['issues'], static fn (array $i): bool => $i['level'] === 'error'));
        $warnings = \count($report['issues']) - $errors;

        if ($format === 'json') {
            $output->writeln(json_encode($report, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR), OutputInterface::OUTPUT_RAW);

            return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
        }

        // Le contenu vient des templates analysés : il est échappé avant d'atteindre le formateur de la console.
        $e = static fn (mixed $v): string => OutputFormatter::escape((string) $v);
        foreach ($report['issues'] as $issue) {
            $mark = $issue['level'] === 'error' ? '<error>✖</error>' : '<comment>⚠</comment>';
            $io->writeln(\sprintf('%s %s:%s  [%s] %s', $mark, $e($issue['file']), $e($issue['line']), $e($issue['rule']), $e($issue['message'])));
            if (isset($issue['fix']) && $issue['fix'] !== '') {
                $io->writeln('    → '.$e($issue['fix']));
            }
        }
        $summary = \sprintf('%d fichier(s) analysé(s) — %d erreur(s), %d avertissement(s)', $report['files'], $errors, $warnings);
        if ($errors > 0) {
            $io->error($summary);

            return Command::FAILURE;
        }
        $io->success($summary);

        return Command::SUCCESS;
    }
}

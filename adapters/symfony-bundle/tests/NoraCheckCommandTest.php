<?php

// NoraIvoire — tests de bin/console nora:check. © 2026 Jonathan KABLAN — Propriétaire.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Tests;

use NoraIvoire\SymfonyBundle\Check\NoraChecker;
use NoraIvoire\SymfonyBundle\Check\NoraCheckException;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Process\ExecutableFinder;

final class NoraCheckCommandTest extends KernelTestCase
{
    protected function setUp(): void
    {
        if ((new ExecutableFinder())->find('node') === null) {
            self::markTestSkipped('Node.js absent : nora:check délègue au CLI NoraIvoire.');
        }
    }

    private function tester(): CommandTester
    {
        $application = new Application(self::bootKernel());

        return new CommandTester($application->find('nora:check'));
    }

    public function testTemplatesConformes(): void
    {
        $tester = $this->tester();
        $code = $tester->execute([]);
        self::assertSame(Command::SUCCESS, $code, $tester->getDisplay());
        self::assertStringContainsString('0 erreur(s)', $tester->getDisplay());
    }

    public function testTemplatesFautifs(): void
    {
        $tester = $this->tester();
        $code = $tester->execute(['paths' => ['tests/Fixtures/templates/bad']]);
        self::assertSame(Command::FAILURE, $code);
        self::assertStringContainsString('page.html.twig', $tester->getDisplay());
    }

    public function testFormatJson(): void
    {
        $tester = $this->tester();
        $tester->execute(['paths' => ['tests/Fixtures/templates/bad'], '--format' => 'json']);
        $report = json_decode($tester->getDisplay(), true, 16, \JSON_THROW_ON_ERROR);
        self::assertSame(1, $report['files']);
        self::assertGreaterThan(0, $report['errors']);
        self::assertNotEmpty(array_filter($report['issues'], static fn (array $i): bool => $i['level'] === 'error'));
    }

    public function testFormatInconnuRefuse(): void
    {
        self::assertSame(Command::INVALID, $this->tester()->execute(['--format' => 'xml']));
    }

    public function testCheminHorsDuProjetRefuse(): void
    {
        $tester = $this->tester();
        self::assertSame(Command::FAILURE, $tester->execute(['paths' => ['../../packages']]));
        self::assertStringContainsString('hors du projet', $tester->getDisplay());
    }

    public function testUnCheminNePeutPasInjecterDOption(): void
    {
        // « --format=text » passé comme chemin : inexistant, donc refusé avant d'atteindre le CLI.
        $tester = $this->tester();
        self::assertSame(Command::FAILURE, $tester->execute(['paths' => ['--manifest=/etc/passwd']]));
        self::assertStringContainsString('introuvable', $tester->getDisplay());
    }

    public function testResolutionDesChemins(): void
    {
        /** @var NoraChecker $checker */
        $checker = self::getContainer()->get('noraivoire.checker');
        $root = (string) realpath(\dirname(__DIR__));
        self::assertSame($root.'/tests', $checker->resolvePath('tests'));
        self::assertSame($root.'/tests', $checker->resolvePath($root.'/tests'));
        foreach (['/etc', '..', "tests\0", ''] as $bad) {
            try {
                $checker->resolvePath($bad);
                self::fail('chemin accepté : '.$bad);
            } catch (NoraCheckException) {
                self::addToAssertionCount(1);
            }
        }
    }
}

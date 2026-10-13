<?php

// NoraIvoire — tests du code PHP généré (enums, NoraManifest). © 2026 Jonathan KABLAN — Propriétaire.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Tests;

use NoraIvoire\SymfonyBundle\Generated\Enum\NoraComponent;
use NoraIvoire\SymfonyBundle\Generated\Enum\NoraSize;
use NoraIvoire\SymfonyBundle\Generated\Enum\NoraTone;
use NoraIvoire\SymfonyBundle\Generated\NoraManifest;
use NoraIvoire\SymfonyBundle\NoraIvoireBundle;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class GeneratedCodeTest extends TestCase
{
    /** @return array<string, mixed> */
    private static function manifest(): array
    {
        $json = file_get_contents(NoraIvoireBundle::generatedDir().'/manifest.json');
        self::assertIsString($json, 'lancer npm run build && npm run symfony:sync');

        return json_decode($json, true, 64, \JSON_THROW_ON_ERROR);
    }

    public function testLesFichiersGenerésPortentLEnTeteDePropriete(): void
    {
        $files = glob(NoraIvoireBundle::generatedDir().'/{src,src/Enum,templates/components/Nora}/*.{php,twig}', \GLOB_BRACE) ?: [];
        self::assertNotEmpty($files);
        foreach ($files as $file) {
            $head = (string) file_get_contents($file, false, null, 0, 400);
            self::assertStringContainsString('Jonathan KABLAN', $head, $file);
            self::assertStringContainsString('Ne pas modifier à la main', $head, $file);
        }
    }

    public function testLeManifestPhpReflèteLeManifestJson(): void
    {
        $manifest = self::manifest();
        self::assertSame($manifest['version'], NoraManifest::VERSION);
        self::assertSame(array_keys($manifest['components']), array_keys(NoraManifest::COMPONENTS));
        foreach ($manifest['components'] as $name => $c) {
            self::assertSame($c['attributes']['data-tone'], NoraManifest::COMPONENTS[$name]['tones']);
            self::assertSame($c['attributes']['data-size'], NoraManifest::COMPONENTS[$name]['sizes']);
            self::assertSame($c['defaults'], NoraManifest::COMPONENTS[$name]['defaults']);
            self::assertSame($c['elements'], NoraManifest::COMPONENTS[$name]['elements']);
        }
    }

    public function testLesEnumsCouvrentToutesLesValeursDuManifest(): void
    {
        $tones = [];
        $sizes = [];
        foreach (self::manifest()['components'] as $c) {
            array_push($tones, ...$c['attributes']['data-tone']);
            array_push($sizes, ...$c['attributes']['data-size']);
        }
        self::assertEqualsCanonicalizing(array_values(array_unique($tones)), NoraTone::values());
        self::assertEqualsCanonicalizing(array_values(array_unique($sizes)), NoraSize::values());
        self::assertSame(array_keys(NoraManifest::COMPONENTS), NoraComponent::values());
    }

    public function testIsAllowedForSuitLeContratDuComposant(): void
    {
        self::assertTrue(NoraTone::Danger->isAllowedFor('btn'));
        self::assertFalse(NoraTone::Danger->isAllowedFor('card'));
        self::assertFalse(NoraSize::Lg->isAllowedFor('badge'));
        self::assertFalse(NoraTone::Primary->isAllowedFor('inconnu'));
        self::assertNull(NoraTone::tryFrom('rainbow'));
    }

    /** @return iterable<string, array{?string, ?string}> */
    public static function hrefs(): iterable
    {
        yield 'chemin' => ['/produits/42', '/produits/42'];
        yield 'ancre' => ['#haut', '#haut'];
        yield 'https' => ['https://exemple.fr', 'https://exemple.fr'];
        yield 'mailto' => ['mailto:contact@exemple.fr', 'mailto:contact@exemple.fr'];
        yield 'tel' => ['tel:+2250700000000', 'tel:+2250700000000'];
        yield 'javascript' => ['javascript:alert(1)', null];
        yield 'JavaScript majuscules' => ['JaVaScRiPt:alert(1)', null];
        yield 'data' => ['data:text/html,<script>', null];
        yield 'protocole relatif' => ['//evil.example', null];
        yield 'barre oblique inverse' => ['/\\evil.example', null];
        yield 'espace initial' => [' javascript:alert(1)', null];
        yield 'relatif nu' => ['page.html', null];
        yield 'vide' => ['', null];
        yield 'null' => [null, null];
    }

    #[DataProvider('hrefs')]
    public function testSafeHrefAppliqueLaListeBlanche(?string $href, ?string $expected): void
    {
        self::assertSame($expected, NoraManifest::safeHref($href));
    }
}

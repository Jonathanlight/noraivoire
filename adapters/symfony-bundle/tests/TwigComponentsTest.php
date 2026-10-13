<?php

// NoraIvoire — rendu des Twig Components Nora:* générés. © 2026 Jonathan KABLAN — Propriétaire.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Tests;

use NoraIvoire\SymfonyBundle\Generated\NoraManifest;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\AssetMapper\AssetMapperInterface;
use Twig\Environment;

final class TwigComponentsTest extends KernelTestCase
{
    /** @param array<string, mixed> $context */
    private function render(string $source, array $context = []): string
    {
        /** @var Environment $twig */
        $twig = self::getContainer()->get('twig');

        // ComponentAttributes préfixe ses attributs d'une espace : on normalise les blancs.
        return trim((string) preg_replace('/\s+/', ' ', $twig->createTemplate($source)->render($context)));
    }

    /** @return iterable<string, array{string}> */
    public static function components(): iterable
    {
        foreach (NoraManifest::COMPONENTS as $name => $c) {
            yield $name => [$name];
        }
    }

    #[DataProvider('components')]
    public function testChaqueComposantDuManifestEstEnregistreEtSeCompile(string $name): void
    {
        $c = NoraManifest::COMPONENTS[$name];
        $html = $this->render(\sprintf('<twig:%s>Contenu</twig:%s>', $c['twig'], $c['twig']));
        self::assertStringContainsString(\sprintf('class="%s"', $name), $html);
        self::assertStringContainsString(\sprintf('data-tone="%s"', $c['defaults']['tone']), $html);
        self::assertStringContainsString(\sprintf('data-size="%s"', $c['defaults']['size']), $html);
    }

    public function testBoutonValide(): void
    {
        $html = $this->render('<twig:Nora:Btn tone="danger" size="lg">Supprimer</twig:Nora:Btn>');
        self::assertSame('<button class="btn" data-tone="danger" data-size="lg" type="button">Supprimer</button>', $html);
    }

    public function testValeursHorsListeBlancheRetombentSurLesDefauts(): void
    {
        $html = $this->render('<twig:Nora:Btn tone="evil&quot; onclick=&quot;x" size="xxl" type="image">X</twig:Nora:Btn>');
        self::assertStringContainsString('data-tone="primary"', $html);
        self::assertStringContainsString('data-size="md"', $html);
        self::assertStringContainsString('type="button"', $html);
        self::assertStringNotContainsString('onclick', $html);
    }

    public function testLesAttributsVerrouillesNePeuventPasEtreForces(): void
    {
        $html = $this->render('<twig:Nora:Btn data-tone="rainbow" data-size="xxl" type="image">X</twig:Nora:Btn>');
        self::assertStringContainsString('data-tone="primary"', $html);
        self::assertStringNotContainsString('rainbow', $html);
        self::assertStringNotContainsString('xxl', $html);
        self::assertStringNotContainsString('image', $html);
    }

    public function testLienAutoriseRendUneAncre(): void
    {
        $html = $this->render('<twig:Nora:Btn href="/produits/42" tone="neutral">Voir</twig:Nora:Btn>');
        self::assertSame('<a class="btn" data-tone="neutral" data-size="md" href="/produits/42">Voir</a>', $html);
    }

    /** @return iterable<string, array{mixed}> */
    public static function dangerousHrefs(): iterable
    {
        yield 'javascript' => ['javascript:alert(1)'];
        yield 'data' => ['data:text/html;base64,PHNjcmlwdD4='];
        yield 'protocole relatif' => ['//evil.example'];
        yield 'barre oblique inverse' => ['/\\evil.example'];
        yield 'espace initial' => [' javascript:alert(1)'];
        yield 'tableau' => [['/ok']];
    }

    #[DataProvider('dangerousHrefs')]
    public function testLienDangereuxRetombeSurUnBouton(mixed $href): void
    {
        // Valeur passée par variable (:href) : comme une URL venant d'un utilisateur, sans réinterprétation par le lexer.
        $html = $this->render('<twig:Nora:Btn :href="href">X</twig:Nora:Btn>', ['href' => $href]);
        self::assertStringStartsWith('<button', $html);
        self::assertStringNotContainsString('href', $html);
    }

    public function testLeContenuEstEchappe(): void
    {
        /** @var Environment $twig */
        $twig = self::getContainer()->get('twig');
        $html = $twig->render('render/escape.html.twig', ['payload' => '<script>alert(1)</script>']);
        self::assertStringNotContainsString('<script>', $html);
        self::assertStringContainsString('&lt;script&gt;', $html);
    }

    public function testElementDeCarteRestreint(): void
    {
        self::assertStringStartsWith('<article class="card"', $this->render('<twig:Nora:Card as="article">A</twig:Nora:Card>'));
        self::assertStringStartsWith('<div class="card"', $this->render('<twig:Nora:Card as="script">A</twig:Nora:Card>'));
    }

    public function testLesAttributsLibresSontConservesEtEchappes(): void
    {
        $html = $this->render('<twig:Nora:Card class="fx-glass" data-fx="tilt" aria-label="{{ \'"><x\' }}">A</twig:Nora:Card>');
        self::assertStringContainsString('fx-glass', $html);
        self::assertStringContainsString('data-fx="tilt"', $html);
        self::assertStringNotContainsString('"><x', $html);
    }

    public function testAssetMapperExposeLeCssEtLeMoteur(): void
    {
        /** @var AssetMapperInterface $mapper */
        $mapper = self::getContainer()->get('asset_mapper');
        foreach (['noraivoire/noraivoire.css', 'noraivoire/noraivoire.min.css', 'noraivoire/noraivoire.engine.js', 'noraivoire/noraivoire.auto.js'] as $logical) {
            self::assertNotNull($mapper->getAsset($logical), $logical);
        }
        // L'import relatif « ./noraivoire.engine.js » du chargeur automatique est résolu par AssetMapper.
        $imports = $mapper->getAsset('noraivoire/noraivoire.auto.js')?->getJavaScriptImports() ?? [];
        self::assertContains('noraivoire/noraivoire.engine.js', array_map(static fn ($i): string => $i->assetLogicalPath, $imports));
    }
}

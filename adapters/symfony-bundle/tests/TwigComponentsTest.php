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

    public function testChampRelieLibelleAideEtErreurAuControle(): void
    {
        $html = $this->render(
            '<twig:Nora:Field id="email" label="E-mail" help="Professionnel." error="Adresse invalide.">'
            .'<twig:Nora:Input id="email" type="email" aria-invalid="true" aria-describedby="email-aide email-erreur" />'
            .'</twig:Nora:Field>'
        );
        self::assertStringContainsString('<label class="field-label" for="email">E-mail</label>', $html);
        self::assertStringContainsString('<p class="field-help" id="email-aide">Professionnel.</p>', $html);
        self::assertStringContainsString('<p class="field-error" id="email-erreur" role="alert">Adresse invalide.</p>', $html);
        self::assertMatchesRegularExpression('/<input [^>]*id="email"/', $html);
        self::assertStringStartsWith('<div class="field" data-tone="neutral" data-size="md">', $html);
    }

    public function testChampEchappeLesTextesEtRefuseUnIdForge(): void
    {
        $html = $this->render('<twig:Nora:Field id="x&quot; onfocus=&quot;y" label="<b>L</b>" error="<script>z</script>">c</twig:Nora:Field>');
        self::assertStringNotContainsString('onfocus', $html);
        self::assertStringNotContainsString('<script>', $html);
        self::assertStringNotContainsString(' for=', $html);
        self::assertStringContainsString('&lt;b&gt;L&lt;/b&gt;', $html);
        self::assertStringContainsString('<p class="field-error" role="alert">', $html);
    }

    public function testChampEnFieldsetUtiliseLegend(): void
    {
        $html = $this->render('<twig:Nora:Field as="fieldset" label="Préférences">c</twig:Nora:Field>');
        self::assertStringStartsWith('<fieldset class="field"', $html);
        self::assertStringContainsString('<legend class="field-label">Préférences</legend>', $html);
        self::assertStringEndsWith('</fieldset>', $html);
    }

    public function testChampTransmetSesAttributsAuControleParEtalement(): void
    {
        $html = $this->render('<twig:Nora:Field id="email" label="E-mail" help="Aide." error="Invalide."><twig:Nora:Input type="email" {{ ...control }} /></twig:Nora:Field>');
        self::assertMatchesRegularExpression('/<input [^>]*id="email"[^>]*aria-describedby="email-aide email-erreur"[^>]*aria-invalid="true"/', $html);

        $ok = $this->render('<twig:Nora:Field id="nom" label="Nom" help="Aide."><twig:Nora:Input {{ ...control }} /></twig:Nora:Field>');
        self::assertMatchesRegularExpression('/<input [^>]*id="nom"[^>]*aria-describedby="nom-aide"/', $ok);
        self::assertStringNotContainsString('aria-invalid', $ok);

        // Sans id valide : aucun attribut transmis, et surtout aucun attribut booléen parasite.
        $none = $this->render('<twig:Nora:Field id="1 x" label="L" error="E"><twig:Nora:Input {{ ...control }} /></twig:Nora:Field>');
        self::assertMatchesRegularExpression('/<input class="input" data-tone="neutral" data-size="md" aria-invalid="true">/', $none);
        self::assertStringNotContainsString('="true" id', $none);
        self::assertStringNotContainsString('aria-describedby', $none);
    }

    public function testChampTransmetAussiAuxCasesEtRadios(): void
    {
        $html = $this->render('<twig:Nora:Field id="cgu" error="Obligatoire."><twig:Nora:Checkbox><input type="checkbox" {{ controlHtml }}> J\'accepte</twig:Nora:Checkbox></twig:Nora:Field>');
        self::assertStringContainsString('aria-describedby="cgu-erreur"', $html);
        self::assertStringContainsString('aria-invalid="true"', $html);
        self::assertStringContainsString('<input type="checkbox" id="cgu" aria-describedby="cgu-erreur" aria-invalid="true">', $html);
    }
}

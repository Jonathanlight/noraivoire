<?php

// NoraIvoire — noyau Symfony minimal pour les tests du bundle. © 2026 Jonathan KABLAN — Propriétaire.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Tests\App;

use NoraIvoire\SymfonyBundle\NoraIvoireBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\UX\TwigComponent\TwigComponentBundle;

final class TestKernel extends Kernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new TwigBundle();
        yield new TwigComponentBundle();
        yield new NoraIvoireBundle();
    }

    /** Racine du bundle : les chemins de nora:check sont confinés à ce dossier. */
    public function getProjectDir(): string
    {
        return \dirname(__DIR__, 2);
    }

    public function getCacheDir(): string
    {
        return sys_get_temp_dir().'/noraivoire-bundle-tests/cache/'.$this->environment;
    }

    public function getLogDir(): string
    {
        return sys_get_temp_dir().'/noraivoire-bundle-tests/log';
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret' => 'test',
            'test' => true,
            'http_method_override' => false,
            'handle_all_throwables' => true,
            'php_errors' => ['log' => true],
            'asset_mapper' => ['paths' => []],
        ]);
        $container->extension('twig', ['default_path' => '%kernel.project_dir%/tests/Fixtures/templates', 'strict_variables' => true]);
        $container->extension('twig_component', ['anonymous_template_directory' => 'components/', 'defaults' => []]);
        $container->extension('noraivoire', [
            // CLI du dépôt : en projet réel, node_modules/@noraivoire/cli/src/cli.js (valeur par défaut).
            'cli_path' => '%kernel.project_dir%/../../packages/cli/src/cli.js',
            'check_paths' => ['tests/Fixtures/templates/ok'],
        ]);
    }
}

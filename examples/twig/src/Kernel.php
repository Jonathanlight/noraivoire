<?php

// NoraIvoire — application Symfony minimale de démonstration du modèle Twig.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

declare(strict_types=1);

namespace App;

use NoraIvoire\SymfonyBundle\NoraIvoireBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
use Symfony\UX\TwigComponent\TwigComponentBundle;
use Twig\Environment;

final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new TwigBundle();
        yield new TwigComponentBundle();
        yield new NoraIvoireBundle();
    }

    public function getProjectDir(): string
    {
        return \dirname(__DIR__);
    }

    public function getCacheDir(): string
    {
        return sys_get_temp_dir().'/noraivoire-example-twig/'.hash('xxh128', __DIR__).'/cache/'.$this->environment;
    }

    public function getLogDir(): string
    {
        return sys_get_temp_dir().'/noraivoire-example-twig/'.hash('xxh128', __DIR__).'/log';
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret' => 'exemple-noraivoire-sans-secret-reel',
            'http_method_override' => false,
            'handle_all_throwables' => true,
            'session' => ['storage_factory_id' => 'session.storage.factory.native'],
            'csrf_protection' => true,
            'php_errors' => ['log' => true],
            'router' => ['utf8' => true],
            // La dist compilée est servie telle quelle, sous vendor/noraivoire/ (cf. templates/twig/base.html.twig).
            'asset_mapper' => ['paths' => ['assets/' => '', '../../packages/core/dist/' => 'vendor/noraivoire']],
        ]);
        // Les modèles sont lus directement dans templates/twig/ : aucune copie.
        $container->extension('twig', ['default_path' => '%kernel.project_dir%/../../templates/twig']);
        $container->extension('twig_component', ['anonymous_template_directory' => 'components/', 'defaults' => []]);
        $container->extension('noraivoire', [
            'cli_path' => '%kernel.project_dir%/../../packages/cli/src/cli.js',
            'check_paths' => ['../../templates/twig'],
        ]);
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->add('home', '/')->controller([self::class, 'home']);
        $routes->add('product_show', '/produits/{id}')->controller([self::class, 'home'])->requirements(['id' => '\d+']);
        $routes->add('contact', '/contact')->controller([self::class, 'home'])->methods(['GET', 'POST']);
    }

    /** Données de démonstration fictives. */
    public function home(Environment $twig): Response
    {
        return new Response($twig->render('page.html.twig', [
            'products' => [
                ['id' => 1, 'name' => 'Attiéké premium', 'description' => 'Semoule de manioc, sachet de 1 kg.', 'inStock' => true],
                ['id' => 2, 'name' => 'Pagne wax', 'description' => 'Coton imprimé, 6 yards.', 'inStock' => false],
                ['id' => 3, 'name' => 'Café de Man', 'description' => 'Arabica torréfié, 250 g.', 'inStock' => true],
            ],
            'sujets' => [
                ['value' => 'commande', 'label' => 'Une commande'],
                ['value' => 'livraison', 'label' => 'La livraison'],
            ],
            'email_error' => null,
            'last_email' => '',
        ]));
    }
}

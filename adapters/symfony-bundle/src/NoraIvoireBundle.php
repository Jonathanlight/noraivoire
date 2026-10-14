<?php

// NoraIvoire — bundle Symfony. © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle;

use NoraIvoire\SymfonyBundle\Check\NoraChecker;
use NoraIvoire\SymfonyBundle\Command\NoraCheckCommand;
use Symfony\Component\AssetMapper\AssetMapperInterface;
use Symfony\Component\Config\Definition\Configurator\DefinitionConfigurator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

use function Symfony\Component\DependencyInjection\Loader\Configurator\param;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

/**
 * Enregistre :
 *  - les Twig Components anonymes `Nora:*` générés (generated/templates/components/Nora/) ;
 *  - le dossier generated/assets/ dans AssetMapper sous le préfixe `noraivoire/` ;
 *  - la commande `nora:check`.
 */
final class NoraIvoireBundle extends AbstractBundle
{
    /** Clé de configuration : noraivoire: (et non nora_ivoire:). */
    protected string $extensionAlias = 'noraivoire';

    public static function generatedDir(): string
    {
        return \dirname(__DIR__).'/generated';
    }

    public function configure(DefinitionConfigurator $definition): void
    {
        $definition->rootNode()
            ->children()
                ->scalarNode('node_binary')
                    ->info('Exécutable Node.js utilisé par nora:check (nom dans le PATH ou chemin absolu).')
                    ->defaultValue('node')
                    ->cannotBeEmpty()
                ->end()
                ->scalarNode('cli_path')
                    ->info('Chemin du CLI NoraIvoire (cli.js). Par défaut : node_modules/@jonathankablan/noraivoire-cli/src/cli.js du projet.')
                    ->defaultNull()
                ->end()
                ->arrayNode('check_paths')
                    ->info('Chemins analysés par défaut par nora:check, relatifs au projet.')
                    ->scalarPrototype()->cannotBeEmpty()->end()
                    ->defaultValue(['templates'])
                ->end()
                ->integerNode('timeout')
                    ->info('Durée maximale de nora:check, en secondes.')
                    ->defaultValue(60)
                    ->min(1)
                    ->max(600)
                ->end()
            ->end();
    }

    public function prependExtension(ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        $generated = self::generatedDir();
        // Espace de noms Twig principal : <twig:Nora:Btn> → components/Nora/Btn.html.twig.
        $builder->prependExtensionConfig('twig', ['paths' => [$generated.'/templates' => null]]);
        if (interface_exists(AssetMapperInterface::class)) {
            // asset('noraivoire/noraivoire.css') et importmap 'noraivoire/noraivoire.auto.js'.
            $builder->prependExtensionConfig('framework', ['asset_mapper' => ['paths' => [$generated.'/assets' => 'noraivoire']]]);
        }
    }

    /**
     * @param array{node_binary: string, cli_path: ?string, check_paths: list<string>, timeout: int} $config
     */
    public function loadExtension(array $config, ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        $services = $container->services();
        $services->set('noraivoire.checker', NoraChecker::class)
            ->args([
                param('kernel.project_dir'),
                $config['node_binary'],
                $config['cli_path'],
                self::generatedDir().'/manifest.json',
                $config['timeout'],
            ]);
        $services->set('noraivoire.command.check', NoraCheckCommand::class)
            ->args([service('noraivoire.checker'), $config['check_paths']])
            ->tag('console.command');
    }
}

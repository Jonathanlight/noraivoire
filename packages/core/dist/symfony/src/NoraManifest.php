<?php

// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (php) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Generated;

/** Contrat NoraIvoire 0.1.0 exposé à PHP (lecture seule). */
final class NoraManifest
{
    public const VERSION = '0.1.0';

    /** @var array<string, array{tones: list<string>, sizes: list<string>, defaults: array{tone: string, size: string}, elements: list<string>, shape: string, twig: string}> */
    public const COMPONENTS = [
        'avatar' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['img', 'span'],
            'shape' => 'avatar',
            'twig' => 'Nora:Avatar',
        ],
        'badge' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md'],
            'defaults' => ['tone' => 'neutral', 'size' => 'sm'],
            'elements' => ['span'],
            'shape' => 'label',
            'twig' => 'Nora:Badge',
        ],
        'btn' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'primary', 'size' => 'md'],
            'elements' => ['button', 'a'],
            'shape' => 'interactive',
            'twig' => 'Nora:Btn',
        ],
        'card' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['div', 'article', 'section', 'li'],
            'shape' => 'container',
            'twig' => 'Nora:Card',
        ],
        'checkbox' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'primary', 'size' => 'md'],
            'elements' => ['label'],
            'shape' => 'toggle',
            'twig' => 'Nora:Checkbox',
        ],
        'field' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['div', 'fieldset'],
            'shape' => 'group',
            'twig' => 'Nora:Field',
        ],
        'input' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['input'],
            'shape' => 'control',
            'twig' => 'Nora:Input',
        ],
        'link' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'primary', 'size' => 'md'],
            'elements' => ['a'],
            'shape' => 'link',
            'twig' => 'Nora:Link',
        ],
        'media' => [
            'tones' => ['neutral'],
            'sizes' => ['wide', 'standard', 'square', 'portrait'],
            'defaults' => ['tone' => 'neutral', 'size' => 'wide'],
            'elements' => ['figure', 'div'],
            'shape' => 'media',
            'twig' => 'Nora:Media',
        ],
        'navbar' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['nav'],
            'shape' => 'nav',
            'twig' => 'Nora:Navbar',
        ],
        'radio' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'primary', 'size' => 'md'],
            'elements' => ['label'],
            'shape' => 'toggle',
            'twig' => 'Nora:Radio',
        ],
        'select' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['select'],
            'shape' => 'control',
            'twig' => 'Nora:Select',
        ],
        'switch' => [
            'tones' => ['primary', 'neutral', 'danger', 'success', 'warning'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'primary', 'size' => 'md'],
            'elements' => ['label'],
            'shape' => 'toggle',
            'twig' => 'Nora:Switch',
        ],
        'textarea' => [
            'tones' => ['neutral'],
            'sizes' => ['sm', 'md', 'lg'],
            'defaults' => ['tone' => 'neutral', 'size' => 'md'],
            'elements' => ['textarea'],
            'shape' => 'control',
            'twig' => 'Nora:Textarea',
        ],
    ];

    /** @var list<string> */
    public const EFFECTS = ['reveal', 'tilt', 'parallax', 'pin', 'scrub', 'scramble', 'split'];

    /** @var list<string> */
    public const SURFACES = ['fx-glass'];

    /** @var list<string> */
    public const URL_ALLOWED_PREFIXES = ['/', '#', 'https://', 'http://', 'mailto:', 'tel:'];

    /** @var list<string> */
    public const URL_DENIED_PREFIXES = ['//', '/\\'];

    /** Applique la liste blanche des schémas d'URL (même règle que les Twig Components). */
    public static function safeHref(?string $href): ?string
    {
        if ($href === null || $href === '') {
            return null;
        }
        foreach (self::URL_DENIED_PREFIXES as $prefix) {
            if (str_starts_with($href, $prefix)) {
                return null;
            }
        }
        foreach (self::URL_ALLOWED_PREFIXES as $prefix) {
            if (str_starts_with($href, $prefix)) {
                return $href;
            }
        }

        return null;
    }

    private function __construct()
    {
    }
}

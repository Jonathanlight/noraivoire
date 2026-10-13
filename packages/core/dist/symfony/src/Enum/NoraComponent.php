<?php

// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (php) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Generated\Enum;

/** Composants NoraIvoire. */
enum NoraComponent: string
{
    case Badge = 'badge';
    case Btn = 'btn';
    case Card = 'card';
    case Checkbox = 'checkbox';
    case Field = 'field';
    case Input = 'input';
    case Radio = 'radio';
    case Select = 'select';
    case Switch = 'switch';
    case Textarea = 'textarea';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }
}

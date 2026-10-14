<?php

// NoraIvoire 0.1.2 — fichier GÉNÉRÉ (php) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.

declare(strict_types=1);

namespace NoraIvoire\SymfonyBundle\Generated\Enum;

use NoraIvoire\SymfonyBundle\Generated\NoraManifest;

/** Tons NoraIvoire (data-tone). */
enum NoraTone: string
{
    case Primary = 'primary';
    case Neutral = 'neutral';
    case Danger = 'danger';
    case Success = 'success';
    case Warning = 'warning';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }

    /** Vrai si cette valeur est acceptée par le composant (ex. NoraTone::Danger->isAllowedFor('btn')). */
    public function isAllowedFor(string $component): bool
    {
        return \in_array($this->value, NoraManifest::COMPONENTS[$component]['tones'] ?? [], true);
    }
}

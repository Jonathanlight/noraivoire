<?php

// NoraIvoire — refuse toute dépendance Composer sous licence copyleft.
// Usage : composer licenses --format=json | php tool/check-licenses.php
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.

declare(strict_types=1);

$report = json_decode((string) stream_get_contents(\STDIN), true, 64, \JSON_THROW_ON_ERROR);
$refused = [];
foreach ($report['dependencies'] ?? [] as $package => $info) {
    foreach ($info['license'] ?? [] as $license) {
        // GPL couvre aussi AGPL et LGPL.
        if (preg_match('/GPL|EUPL|SSPL|OSL/i', (string) $license)) {
            $refused[] = \sprintf('%s (%s)', $package, $license);
        }
    }
}
if ($refused !== []) {
    fwrite(\STDERR, 'Licences copyleft refusées : '.implode(', ', $refused).\PHP_EOL);
    exit(1);
}
echo \sprintf('Licences : %d paquet(s), aucune licence copyleft.', \count($report['dependencies'] ?? [])).\PHP_EOL;

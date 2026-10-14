<?php

// NoraIvoire — point d'entrée HTTP de l'exemple Twig (php -S 127.0.0.1:8000 -t public public/index.php).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

declare(strict_types=1);

use App\Kernel;
use Symfony\Component\HttpFoundation\Request;

require \dirname(__DIR__).'/vendor/autoload.php';

$kernel = new Kernel('dev', true);
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);

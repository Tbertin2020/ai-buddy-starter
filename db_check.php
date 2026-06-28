<?php
$host = 'localhost';
$db   = 'rwandadb';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connection successful!\n";
     
     $tables = ['districts', 'indicators', 'district_indicators', 'users'];
     foreach ($tables as $table) {
         $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
         $row = $stmt->fetch();
         echo "Table '$table' has " . $row['count'] . " rows.\n";
     }
} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage() . "\n";
}

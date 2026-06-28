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
     $newHash = password_hash('admin123', PASSWORD_BCRYPT);
     
     $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
     $stmt->execute([$newHash, 'admin@rwandadb.org']);
     $stmt->execute([$newHash, 'eric@gmail.com']);
     
     echo "Passwords updated successfully to 'admin123'!\n";
} catch (\PDOException $e) {
     echo "Failed to update passwords: " . $e->getMessage() . "\n";
}

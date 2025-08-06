CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

CREATE TABLE IF NOT EXISTS portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(10),
    company_name VARCHAR(100),
    quantity INT,
    average_buy_price DECIMAL(10, 2),
    purchase_date DATE
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(10),
    type ENUM('BUY', 'SELL'),
    quantity INT,
    price DECIMAL(10, 2),
    date DATE
);

ALTER TABLE portfolio ADD COLUMN sector VARCHAR(255);

-- Проверка структуры таблицы user_credits

-- Показать все столбцы таблицы user_credits
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_credits'
ORDER BY ordinal_position;

-- Показать ваши текущие кредиты
SELECT * FROM user_credits LIMIT 5;

-- 🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА таблицы user_credits

-- 1. Показать ВСЕ столбцы таблицы user_credits
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_credits'
ORDER BY ordinal_position;

-- 2. Показать данные (ваши кредиты)
SELECT * FROM user_credits LIMIT 5;

-- 3. Найти PRIMARY KEY
SELECT
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'user_credits'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 4. Попробовать простой UPDATE (замените на свой UUID)
-- UPDATE user_credits SET free_credits = free_credits WHERE id = 'ваш-user-id';

-- Показать код существующей функции get_credits
-- Эта функция работает, значит мы можем посмотреть как она обращается к user_credits

SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_credits';

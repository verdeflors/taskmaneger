import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zkqfppixdzfaysskfwfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWZwcGl4ZHpmYXlzc2tmd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjYxMjgsImV4cCI6MjA5MDI0MjEyOH0.mths7-No-Jj614fOn2V9BgDoRq8p5L7BD_GOokax0xk'
)

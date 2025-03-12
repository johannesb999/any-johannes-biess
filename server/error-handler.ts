import { H3Error } from 'h3';

export default function(error: H3Error, event: any) {
  // Generiere eine eindeutige Fehler-ID für einfachere Identifikation
  const errorId = `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  console.error(`🚨 [${errorId}] Unbehandelter Server-Fehler:`, error);
  console.error(`🔍 [${errorId}] URL: ${event.path}, Methode: ${event.method}`);
  console.error(`📜 [${errorId}] Stack trace:`, error.stack);
  
  // Zusätzliche Informationen je nach Fehlertyp
  if (error.cause) {
    console.error(`⛓️ [${errorId}] Ursache:`, error.cause);
  }
  
  // Umgebungsvariablen in Produktion nicht anzeigen
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 [${errorId}] Umgebungsvariablen:`, {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL_defined: !!process.env.SUPABASE_URL,
      SUPABASE_KEY_defined: !!process.env.SUPABASE_KEY
    });
  }
  
  // In Produktion sensible Daten entfernen
  const sanitizedError = {
    statusCode: error.statusCode || 500,
    statusMessage: error.statusMessage,
    message: process.env.NODE_ENV === 'production' 
      ? 'Ein Serverfehler ist aufgetreten'
      : error.message,
    errorId: errorId
  };
  
  return sanitizedError;
}

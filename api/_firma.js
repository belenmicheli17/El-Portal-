// Firma del link de baja de avisos: así nadie puede dar de baja a otra persona
import { createHmac } from 'node:crypto';

export function firmaBaja(uid) {
  return createHmac('sha256', process.env.CRON_SECRET || '').update(String(uid)).digest('hex').slice(0, 32);
}

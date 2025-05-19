import type { Device as SpotifyDevice } from '@spotify/web-api-ts-sdk';

export interface Device extends Omit<SpotifyDevice, 'id'> {
  id: string | null;
  name: string;
  type: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  volume_percent: number | null;
}

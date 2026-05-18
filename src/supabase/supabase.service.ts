import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(config: ConfigService) {
    const supabaseKey =
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      config.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      supabaseKey,
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService {
    private readonly client;
    constructor(config: ConfigService);
    getClient(): SupabaseClient;
}

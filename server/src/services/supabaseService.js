const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.SUPABASE_BUCKET || 'compressed-files';

let supabase = null;

try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('[Supabase] Initialized client successfully with URL:', supabaseUrl);
} catch (e) {
  console.error('[Supabase] Init error:', e.message);
}

function isConfigured() {
  return !!supabase;
}

function getConfig() {
  return {
    configured: isConfigured(),
    url: supabaseUrl,
    bucket: supabaseBucket
  };
}

/**
 * Sign up with Supabase Auth
 */
async function signUp(emailOrUsername, password) {
  if (!isConfigured()) return null;
  const email = emailOrUsername.includes('@')
    ? emailOrUsername
    : `${emailOrUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@compressx.local`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: emailOrUsername }
  });

  if (error) {
    // If user already exists, attempt signIn
    if (error.message.includes('already exists')) {
      return signIn(emailOrUsername, password);
    }
    throw error;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    username: emailOrUsername,
    token: data.user.id
  };
}

/**
 * Sign in with Supabase Auth
 */
async function signIn(emailOrUsername, password) {
  if (!isConfigured()) return null;
  const email = emailOrUsername.includes('@')
    ? emailOrUsername
    : `${emailOrUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@compressx.local`;

  // Use client auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return {
    id: data.user.id,
    email: data.user.email,
    username: data.user.user_metadata?.username || emailOrUsername,
    token: data.session.access_token
  };
}

/**
 * Upload compressed file to Supabase Storage Bucket ('compressed-files')
 */
async function uploadToStorage(filePath, filename, mimeType = 'application/octet-stream') {
  if (!isConfigured()) return null;

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${Date.now()}_${path.basename(filename)}`;

    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(storagePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('[Supabase Storage] Upload exception:', err);
    return null;
  }
}

/**
 * Save job to Supabase Database table 'history'
 */
async function insertHistoryRow(job) {
  if (!isConfigured()) return null;

  try {
    const row = {
      id: job.id,
      user_id: job.user_id || 'guest',
      filename: job.original_filename,
      original_size: job.original_size,
      compressed_size: job.result_size,
      space_saved: job.space_saved,
      space_saved_percentage: job.space_saved_percentage,
      algorithm: job.algorithm,
      file_url: job.file_url || null,
      created_at: job.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('history')
      .insert([row])
      .select();

    if (error) {
      console.warn('[Supabase DB] Note (run supabase_setup.sql in editor if table not created):', error.message);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch user history from Supabase (Strictly for a specific authenticated user)
 */
async function getUserHistory(userId) {
  if (!isConfigured() || !userId || userId === 'guest') return [];

  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Delete history row from Supabase
 */
async function deleteHistoryRow(id, userId) {
  if (!isConfigured()) return false;
  try {
    let query = supabase.from('history').delete().eq('id', id);
    if (userId && userId !== 'guest') {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Clear all history for a specific user (or all if not specified)
 */
async function clearUserHistory(userId) {
  if (!isConfigured()) return false;
  try {
    let query = supabase.from('history').delete();
    if (userId && userId !== 'guest') {
      query = query.eq('user_id', userId);
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    return false;
  }
}

module.exports = {
  isConfigured,
  getConfig,
  signUp,
  signIn,
  uploadToStorage,
  insertHistoryRow,
  getUserHistory,
  deleteHistoryRow,
  clearUserHistory
};

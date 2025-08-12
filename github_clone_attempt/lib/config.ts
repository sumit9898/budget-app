export const config = {
  backend: (process.env.CONVERSION_BACKEND || 'cloudconvert') as 'cloudconvert' | 'local',
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 2 * 1024 * 1024 * 1024),
  autoDeleteMinutes: Number(process.env.AUTO_DELETE_MINUTES || 30),
  enableVirusScan: String(process.env.ENABLE_VIRUS_SCAN || 'false') === 'true',
  rateLimitPerHour: Number(process.env.RATE_LIMIT_PER_HOUR || 60),
  storageDriver: (process.env.STORAGE_DRIVER || 'memory') as 'memory' | 'disk' | 's3',
  diskPath: process.env.DISK_STORAGE_PATH || '.data/storage',
};


module.exports = {
   JOBS_PORT: process.env.JOBS_PORT || 4005,
   MYSQL_HOST: process.env.MYSQL_HOST || '192.168.0.19',
   MYSQL_USER: process.env.MYSQL_USER || 'root' ,
   MYSQL_DB: process.env.MYSQL_DB || 'battle_rangers_new',
   MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '1100',
   MYSQL_PORT: process.env.MYSQL_PORT || 3306,
   WEB_ORIGIN:process.env.WEB_ORIGIN ,
   IMPORT_STORAGE:process.env.IMPORT_STORAGE ,
   BACKUP_STORAGE:process.env.BACKUP_STORAGE ,
   VMID_RANGE_START:process.env.VMID_RANGE_START ,
   VMID_RANGE_END:process.env.VMID_RANGE_END ,
   CLONE_STORAGE:process.env.CLONE_STORAGE 
};

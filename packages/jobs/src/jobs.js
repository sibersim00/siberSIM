const cron = require("node-cron");
const MailJob = require("./services/mail_service");
const NotiJob = require("./services/noti_service");
const autoTerminateExpiredEvents =
  require("../src/components/eventlearner/dao").autoTerminateExpiredEvents;
const updateCompleteTerminate =
  require("../src/components/eventlearner/dao").updateCompleteTerminate;
const updateCompleteTerminatelearner =
  require("../src/components/vmconfigs/dao").updateCompleteTerminatelearner;
const autoTerminateFailedScenarios =
  require("../src/components/vmconfigs/dao").autoTerminateFailedScenarios;

const checkBackupStatus =
  require("../src/components/vmconfigs/dao").checkBackupStatus;

const sendRunningUserReminder =
  require("../src/components/vmconfigs/dao").sendRunningUserReminder;
  
class initJob {
  constructor() {
    this.isEmailJobRunning = false;
  }

  async notirun({ db }) {
    const notiJob = new NotiJob(db);
    const notiList = await notiJob.getUnprocessedNotifications();
    console.log("notiList==========>", notiList);
    for (const noti of notiList) {
      await notiJob.triggerNoti(noti);
      await notiJob.markAsProcessedNotifications(noti.log_id);
    }
  }

  async mailrun({ db }) {
    if (this.isEmailJobRunning) return;
    this.isEmailJobRunning = true;
    const mailJob = new MailJob(db);
    const emailList = await mailJob.getUnprocessedEmails();
    for (const email of emailList) {
      if (email.payload.attachments && email.payload.attachments.length > 0) {
        if (email.payload.attachments[0] == null) {
          email.payload.attachments = email.attachments;
        }
      }
      await mailJob.triggerEmail(email);
    }
    this.isEmailJobRunning = false;
  }

  async terminateExpiredEvents({ db }) {
    const ipAddress = "";
    const job = autoTerminateExpiredEvents({
      db,
      ipAddress,
      updateCompleteTerminate,
    });
    const result = await job();
    console.log("Midnight Auto-Terminate Result:", result.message);
  }

  async terminateFailedScenarios({ db }) {
    const ipAddress = "";
    const job = autoTerminateFailedScenarios({
      db,
      ipAddress,
      updateCompleteTerminatelearner,
    });
    const result = await job();
    console.log("Operation Failed Scenario Cleanup Result:", result.message);
  }
  async checkbackupstatus({ db }) {
    const ipAddress = "";
    const job = checkBackupStatus({
      db,
      ipAddress
    });
    const result = await job();
    console.log("Operation Failed for Check backup status:", result);
  }


  async runningUserReminder({ db }) {
  const ipAddress = "";
  const job = sendRunningUserReminder({ 
    db,
    ipAddress
   });
  const result = await job();
  console.log("Running User Reminderfffffff", result.message);
}

}


const commonCronConfig = {
  scheduled: true,
  timezone: "Asia/Kolkata",
};

const startJob = async ({ db  }) => {
  const jobs = new initJob();

  // Process notifications every 10 sec
  cron.schedule("*/3 * * * * *",
    () => {
      console.log("PROCESS NOTIFICATION IN EVERY 30 SEC.");
      jobs.notirun({ db }).catch((e) => {
        console.log(e);
      });
    },
    commonCronConfig
  );

  // Send queued mails every 10 sec (uncomment if needed)
  cron.schedule('*/30 * * * * *', () => {
    console.log("SEND QUEUED MAILS EVERY 30 SEC.");
    jobs.mailrun({ db }).catch(e => {
      console.log(e);
      jobs.isEmailJobRunning = false;
    });
  }, commonCronConfig);

  // Run auto-terminate job every midnight
  cron.schedule("0 0 * * *",
    () => {
      console.log("Running midnight auto-terminate job...");
      jobs.terminateExpiredEvents({ db }).catch((e) => {
        console.error("Auto-terminate job failed:", e);
      });
    },
    commonCronConfig
  );

  cron.schedule("0 0 * * *", // every day at midnight
    () => {
      console.log(
        "Running auto-cleanup for Operation Failed scenario sessions..."
      );
      jobs.terminateFailedScenarios({ db }).catch((err) => {
        console.error("Auto-cleanup cron failed:", err);
      });
    },
    commonCronConfig
  );

  cron.schedule("*/30 * * * * *",   // Every 30 seconds
    () => {
      console.log("Checking backup status for all UPIDs...");
      jobs.checkbackupstatus({ db }).catch(err =>
        console.error("Backup status cron failed:", err)
      );
    },
    commonCronConfig
  );


//   cron.schedule(
//   "*/1 * * * *", // 1 min
//   () => {
//     console.log("Running Lab Reminder Cron...");
//     jobs.runningUserReminder({ db }).catch((err) => {
//       console.error("Reminder cron failed:", err);
//     });
//   },
//   commonCronConfig
// );

setInterval(() => {
  console.log("Running Lab Reminder every 5 seconds...");
  jobs.runningUserReminder({ db }).catch((err) => {
    console.error("Reminder failed:", err);
  });
}, 20000); // 5000 milliseconds = 50 seconds

};


module.exports = startJob;

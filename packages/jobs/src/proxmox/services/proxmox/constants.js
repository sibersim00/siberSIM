// constants.js

require("dotenv").config();

const CONFIG_VALUES = {
  endpoint: process.env.PROXMOX_ENDPOINT,
  username: process.env.PROXMOX_USERNAME,
  password: process.env.PROXMOX_PASSWORD,
  current_node: process.env.PROXMOX_CURRENT_NODE,

  
  cookie_prefix: process.env.PROXMOX_COOKIE_PREFIX,
  full: "0",
};
const VM_PROCESSES = {
  GENERATE_ACCESS_TICKET:"Generate Access Ticket",
  QEMU_LIST: "QEMU List",
  LXC_LIST: "LXC List",
  LXC_CONTAINER_DETAIL: "LXC Container Detail",
  QEMU_VM_DETAIL: "QEMU VM Detail",
  CLONE_VM: "Clone VM",
  CONFIGURE_VM: "Configure VM",
  START_VM: "Start VM",
  STOP_VM: "Stop VM",
  DESTROY_VM: "Destroy VM",
  NETWORK_INFO:"VM Networks",
  SNAPSHOT_LXC:"LXC Snapshot",
  SNAPSHOT_QEMU:"QEMU Snapshot",
  DELETE_QEMU_SNAPSHOT:"Delete QEMU Snapshot",
  DELETE_LXC_SNAPSHOT:"Delete LXC Snapshot",
  RESTORE_LXC_SNAPSHOT:"Restore LXC Snapshot",
  RESTORE_QEMU_SNAPSHOT:"Restore QEMU Snapshot",
  RESUME_VM:"Resume QEMU VM",
  PAUSE_VM:"Pause QEMU VM",
  GET_TASK_LOG:"Export Status",
  TAKE_BACKUP:"Backup VM",
  FETCH_FILE_NAME:"File Name",
  CLONE_LXC:"Clone LXC Component",
  TEMPLATE_LXC:"Template LXC",
  CLONE_QEMU:"Clone QEMU Component",
  TEMPLATE_QEMU:"Template QEMU",
  GET_QEMU_CONFIG:"QEMU Config",
  DELETE_VM_NETWORK:"Delete Network Port",
  DISCONNECT_VM_NETWORK:"Disconnet Network Port",
  CONNECT_VM_NETWORK:"Connect Network Port",
  GET_VM_NETWORK_INFO:"Network Information",
  UNPLUG_VM_NETWORK:"Unplug Network Port",
  PLUG_VM_NETWORK:"Plug Network Port",
  GET_VM_STATUS:"Get VM Status",
  RESTORE_VM:"Restore VM",
  CHECK_VMID_STATUS:"Check vmid status",
  MIGRATE_VM:"Migrate VM",
  WAIT_FOR_TASK:"Status of VM",
  GET_NODE_NETWORK_INFO:"Get node network information"
};

module.exports = {
  ...CONFIG_VALUES,
  VM_PROCESSES,
};

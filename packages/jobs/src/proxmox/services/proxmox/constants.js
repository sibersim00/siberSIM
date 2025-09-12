// constants.js

require("dotenv").config();

const CONFIG_VALUES = {
  endpoint: process.env.PROXMOX_ENDPOINT,
  username: process.env.PROXMOX_USERNAME,
  password: process.env.PROXMOX_PASSWORD,
  user: process.env.PROXMOX_USER,
  cookie_prefix: process.env.PROXMOX_COOKIE_PREFIX,
  current_node: process.env.PROXMOX_CURRENT_NODE,
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
  NETWORK_INFO:"VM Networks"
};

module.exports = {
  ...CONFIG_VALUES,
  VM_PROCESSES,
};

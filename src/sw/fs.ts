import FS from "@isomorphic-git/lightning-fs";

const fs = new FS("fs");
const pfs = fs.promises;

export default pfs;

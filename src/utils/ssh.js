import { NodeSSH } from 'node-ssh'

export const openSsh = async(data) => {
  try {
    const { type } = data
    if (type === 'sshAccount') {
      return await openSshByAccount(data)
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

export const openSshByAccount = async(data) => {
  const ssh = new NodeSSH()
  const { host, port, account, password } = data
  try {
    await ssh.connect({
      host,
      port,
      username: account,
      password
    })
    return ssh
  } catch (e) {
    return Promise.reject(e)
  }
}

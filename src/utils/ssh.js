import { NodeSSH } from 'node-ssh'

export async function openSsh(data) {
  try {
    const { type } = data
    if (type === 'sshAccount') {
      return await openSshByAccount(data)
    }
  }
  catch (e) {
    return Promise.reject(e)
  }
}

export async function openSshByAccount(data) {
  const ssh = new NodeSSH()
  const { host, port, account, password } = data
  try {
    await ssh.connect({
      host,
      port,
      username: account,
      password,
    })
    return ssh
  }
  catch (e) {
    return Promise.reject(e)
  }
}

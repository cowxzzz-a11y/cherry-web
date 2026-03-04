
export const windowService = {
  getMainWindow: () => ({
    webContents: {
      send: (channel: string, ...args: any[]) => {
        // console.log(`[Mock WindowService] Send: ${channel}`, args);
      }
    },
    isDestroyed: () => false
  })
};

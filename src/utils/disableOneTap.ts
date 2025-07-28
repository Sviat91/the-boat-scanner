const waitForGis = () =>
  new Promise<void>(res => {
    if (window.google?.accounts?.id) return res();
    const i = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(i);
        res();
      }
    }, 50);
  });

waitForGis().then(() => window.google!.accounts.id.disableAutoSelect());

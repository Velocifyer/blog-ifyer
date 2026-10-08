---
title: How to set up secure boot (with your own keys) and lockdown mode and TPM based storage decryption on Arch Linux
dates:
  - "2025-11-21"
  - "2026-2-25"
tags: post
layout: post
description: "Make your system more secure!"
width: 55em
has-dates: true
---

Normaly on arch linux there is no way to know wheater someone took out your ssd and modified the files on the ESP or the root partition.

By encrypting the root partition you can prevent modifications to it but the ESP has to stay unencrypted.

So we will use secure boot (with our own keys) and unified kernel images to prevent tampering with the kernel and initramfs and TPM to verify that secure boot was not disabled.

We will also use kernel lockdown mode in confidentiality mode to prevent loading unsigned kernel modules or reading kernel memory.

After following this guide, you will not have to manualy sign files with secure boot.

<small><STRONG>I AM NOT RESPONSIBLE FOR YOU BREAKING STUFF BY FOLLOWING THIS GUIDE!!</STRONG></small>

            This guide assumes you already installed archlinux with a ESP mounted at /boot/ that is located at /dev/nvme0n1p1 and a LUKS2 encryped root partition that is located at `/dev/nvme0n1p2`and are using mkintcpio and the `linux` kernel and the fish shell and you have sudo installed and set up to let you execute commands as root.
        
## Set up unified kernel images.

        <ol start="0">
            <li>Install `tpm2-tss` with pacman.</li>
            <li>Set the contents of /etc/kernel/cmdline to:
                `rd.luks.name=uuid=root root=/dev/mapper/root rw zswap.enabled=0 rd.luks.options=tpm2-device=auto,tpm2-measure-pcr=yes` replacing `uuid` with the UUID of the LUKS2 root partition. (This file will define the kernel command line.)</li>
            <li>Set /etc/mkinitcpio.d/linux.preset to 
```text
# mkinitcpio preset file for the 'linux' package            
#ALL_config="/etc/mkinitcpio.conf"
ALL_kver="/boot/vmlinuz-linux"
            
PRESETS=('default' 'fallback')
            
#default_config="/etc/mkinitcpio.conf"
default_image="/boot/initramfs-linux.img"
default_uki="/boot/EFI/Linux/arch-linux.efi"
default_options="--splash /usr/share/systemd/bootctl/splash-arch.bmp"
            
#fallback_config="/etc/mkinitcpio.conf"
fallback_image="/boot/initramfs-linux-fallback.img"
fallback_uki="/boot/EFI/Linux/arch-linux-fallback.efi"
fallback_options="-S autodetect"
```
</li>
        <li>
            Set the hooks line in `/etc/mkinitcpio.conf` to `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)`.
        </li>
        <li>
            Run `sudo mkdir -p /boot/EFI/Linux`.
        </li>
        <li>
            Run `sudo mkinitcpio -P`.
        </li>
        <li>Run `sudo efibootmgr --create --disk /dev/nvme0n1p1 --part 1 --label "Arch Linux" --loader '\EFI\Linux\arch-linux.efi' --unicode`,changing the devices to the ones actually in use.</li>
        <li>
            Reboot.
        </li>
        </ol>

## Set up UEFI for secure boot.
        The exact steps for this depend on your hardware.

        Enter your UEFI firmware.
		
		If it has a option to delete specific keys then delete the Platform key and all microsoft keys. 
		
		You may also delete the device manufactuer's keys but I do not recommend it because it may make firmware updates harder. 
		
		If your UEFI does not let you delete specific keys just delete all of them.

        Then set a “Administrator Password” in your UEFI firmware configurator and store the password somewhere safe. You may have to enable secure boot in this step.

        I also reccomend using some sort of tamper evidence to detect if someone opened the device to disable secure boot to get the password. <br/>
		(I use glitter nail polish and stickers over the screws and [the Blink Comparison Android app](https://f-droid.org/en/packages/org.proninyaroslav.blink_comparison/).)

## Set up secure boot with sbctl

0. Install the sbctl pacman package.
1. Run `sudo sbctl create-keys`.
2. Run `sudo mkinitcpio -P`.
3. Run `sudo sbctl enroll-keys -f --yes-this-might-brick-my-machine`.
4. Enable enforcement of secure boot in UEFI.
5. Reboot.


## Set up TPM based decryption of the root partition.

        <ol start="0">
            <li>Run `sudo systemd-cryptenroll /dev/nvme0n1p2 --wipe-slot=password --recovery-key` and save the recovery key securly.</li>
            <li>Run `sudo systemd-cryptenroll /dev/nvme0n1p2 --wipe-slot=empty --tpm2-device=auto --tpm2-pcrs=7+15:sha256=0000000000000000000000000000000000000000000000000000000000000000 --tpm2-with-pin=yes` and set the pin to whatever secret you want to be needed to decrypt the disk.<br/>
			Remove `--tpm2-with-pin=yes` if you do not want a secret to have to be entered in-person (like on a server).</li>
            <li>Reboot</li>
        </ol>
## Set up kernel lockdown mode.

0. Make sure you do not use any unsigned kernel modules.
1. Add `lockdown=confidentiality` to `/etc/kernel/cmdline`.
2. Run `sudo mkinitcpio -P`.
3. Restart the system.

This setup does have some slight vulnerabilities.
For example this only secures against a attacker with root accses until a reboot becuase the secure boot keys are stored on the device.

However this setup does stop a attacker who just has accses to the SSD and not the decryption key from making it run malware.<br/>
I recommend entering a random ammount of incorrect decryption passwords incase the attacker has disabled secure boot and is trying to get your password.

        <!-- <hr/>
            <a class="link" href="https://news.ycombinator.com/item?id=45520217">First Hacker News post</a> -->
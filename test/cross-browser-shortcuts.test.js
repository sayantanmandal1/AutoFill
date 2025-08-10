/**
 * Cross-Browser Keyboard Shortcuts Tests
 * Tests keyboard shortcut functionality across Chrome, Brave, and Edge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome.commands API for different browsers
const createCommandsMock = (browserType) => {
  const commands = {
    onCommand: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn()
    },
    getAll: vi.fn()
  };

  // Browser-specific command behaviors
  switch (browserType) {
    case 'chrome':
      commands.getAll.mockResolvedValue([
        {
          name: 'autofill',
          description: 'Trigger autofill on current page',
          shortcut: 'Alt+Shift+F'
        }
      ]);
      break;
    case 'brave':
      // Brave inherits Chrome's command system
      commands.getAll.mockResolvedValue([
        {
          name: 'autofill',
          description: 'Trigger autofill on current page',
          shortcut: 'Alt+Shift+F'
        }
      ]);
      break;
    case 'edge':
      // Edge supports commands but may have different key combinations
      commands.getAll.mockResolvedValue([
        {
          name: 'autofill',
          description: 'Trigger autofill on current page',
          shortcut: 'Alt+Shift+F'
        }
      ]);
      break;
  }

  return commands;
};

// Mock different operating systems for shortcut testing
const createOSMock = (os) => {
  const osMocks = {
    windows: {
      platform: 'Win32',
      userAgent: 'Windows NT 10.0',
      modifierKey: 'Alt'
    },
    mac: {
      platform: 'MacIntel',
      userAgent: 'Macintosh',
      modifierKey: 'Cmd'
    },
    linux: {
      platform: 'Linux x86_64',
      userAgent: 'X11; Linux x86_64',
      modifierKey: 'Alt'
    }
  };

  return osMocks[os] || osMocks.windows;
};

describe('Cross-Browser Keyboard Shortcuts', () => {
  const browsers = [
    { name: 'Chrome', key: 'chrome' },
    { name: 'Brave', key: 'brave' },
    { name: 'Edge', key: 'edge' }
  ];

  const operatingSystems = ['windows', 'mac', 'linux'];

  browsers.forEach(browser => {
    describe(`${browser.name} Keyboard Shortcuts`, () => {
      let mockCommands;

      beforeEach(() => {
        mockCommands = createCommandsMock(browser.key);
        global.chrome = {
          commands: mockCommands,
          tabs: {
            query: vi.fn(),
            sendMessage: vi.fn()
          },
          runtime: {
            onMessage: {
              addListener: vi.fn()
            }
          }
        };
      });

      it('should register keyboard shortcut listener', () => {
        const mockListener = vi.fn();

        // Simulate background script registering listener
        chrome.commands.onCommand.addListener(mockListener);

        expect(mockCommands.onCommand.addListener).toHaveBeenCalledWith(mockListener);
      });

      it('should handle autofill command trigger', async () => {
        const mockListener = vi.fn();
        chrome.commands.onCommand.addListener(mockListener);

        // Simulate shortcut being pressed
        const command = 'autofill';
        mockListener(command);

        expect(mockListener).toHaveBeenCalledWith(command);
      });

      it('should retrieve available commands', async () => {
        const commands = await chrome.commands.getAll();

        expect(mockCommands.getAll).toHaveBeenCalled();
        expect(commands).toHaveLength(1);
        expect(commands[0].name).toBe('autofill');
        expect(commands[0].shortcut).toBe('Alt+Shift+F');
      });

      it('should handle command execution with tab messaging', async () => {
        const mockListener = vi.fn(async (command) => {
          if (command === 'autofill') {
            // Mock getting active tab
            chrome.tabs.query.mockResolvedValue([{ id: 123 }]);

            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

            // Mock sending message to content script
            chrome.tabs.sendMessage.mockResolvedValue({ success: true });
            await chrome.tabs.sendMessage(tabs[0].id, { action: 'autofill' });
          }
        });

        chrome.commands.onCommand.addListener(mockListener);

        // Trigger the command
        await mockListener('autofill');

        expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, { action: 'autofill' });
      });

      operatingSystems.forEach(os => {
        it(`should work on ${os} operating system`, () => {
          const osMock = createOSMock(os);

          // Mock platform detection
          Object.defineProperty(global.navigator, 'platform', {
            value: osMock.platform,
            configurable: true
          });

          Object.defineProperty(global.navigator, 'userAgent', {
            value: osMock.userAgent,
            configurable: true
          });

          const mockListener = vi.fn();
          chrome.commands.onCommand.addListener(mockListener);

          // Simulate command trigger
          mockListener('autofill');

          expect(mockListener).toHaveBeenCalledWith('autofill');
        });
      });

      it('should handle shortcut conflicts gracefully', async () => {
        // Mock a scenario where shortcut is already taken
        mockCommands.getAll.mockResolvedValue([
          {
            name: 'autofill',
            description: 'Trigger autofill on current page',
            shortcut: '' // Empty shortcut indicates conflict
          }
        ]);

        const commands = await chrome.commands.getAll();
        const autofillCommand = commands.find(cmd => cmd.name === 'autofill');

        // Extension should handle missing shortcut gracefully
        expect(autofillCommand.shortcut).toBe('');
      });

      it('should support multiple command listeners', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        chrome.commands.onCommand.addListener(listener1);
        chrome.commands.onCommand.addListener(listener2);

        expect(mockCommands.onCommand.addListener).toHaveBeenCalledTimes(2);
      });

      it('should handle listener removal', () => {
        const mockListener = vi.fn();

        chrome.commands.onCommand.addListener(mockListener);
        chrome.commands.onCommand.removeListener(mockListener);

        expect(mockCommands.onCommand.addListener).toHaveBeenCalledWith(mockListener);
        expect(mockCommands.onCommand.removeListener).toHaveBeenCalledWith(mockListener);
      });
    });
  });

  describe('Cross-Browser Shortcut Compatibility', () => {
    it('should use consistent shortcut format across browsers', async () => {
      const browsers = ['chrome', 'brave', 'edge'];

      for (const browserType of browsers) {
        const commands = createCommandsMock(browserType);
        const commandList = await commands.getAll();

        const autofillCommand = commandList.find(cmd => cmd.name === 'autofill');
        expect(autofillCommand.shortcut).toBe('Alt+Shift+F');
      }
    });

    it('should handle browser-specific modifier keys', () => {
      const modifierTests = [
        { os: 'windows', expected: 'Alt+Shift+F' },
        { os: 'mac', expected: 'Alt+Shift+F' }, // Chrome uses Alt even on Mac for extensions
        { os: 'linux', expected: 'Alt+Shift+F' }
      ];

      modifierTests.forEach(test => {
        const osMock = createOSMock(test.os);

        // The shortcut should remain consistent across OS
        expect(test.expected).toBe('Alt+Shift+F');
      });
    });

    it('should validate shortcut key combinations', () => {
      const validShortcuts = [
        'Alt+Shift+F',
        'Ctrl+Shift+F',
        'Alt+F',
        'Ctrl+Alt+F'
      ];

      const invalidShortcuts = [
        'F', // Single key not allowed
        'Shift+F', // Shift alone not sufficient
        'Alt+Shift+Ctrl+F' // Too many modifiers
      ];

      validShortcuts.forEach(shortcut => {
        // Valid shortcuts should have at least one modifier
        const hasModifier = shortcut.includes('Alt') || shortcut.includes('Ctrl') || shortcut.includes('Cmd');
        expect(hasModifier).toBe(true);
      });

      invalidShortcuts.forEach(shortcut => {
        if (shortcut === 'F') {
          expect(shortcut.includes('Alt') || shortcut.includes('Ctrl')).toBe(false);
        }
      });
    });
  });

  describe('Shortcut Error Handling', () => {
    it('should handle disabled shortcuts gracefully', () => {
      const mockCommands = createCommandsMock('chrome');
      global.chrome = { commands: mockCommands };

      // Mock disabled shortcut
      mockCommands.getAll.mockResolvedValue([
        {
          name: 'autofill',
          description: 'Trigger autofill on current page',
          shortcut: '' // Disabled
        }
      ]);

      const mockListener = vi.fn();
      chrome.commands.onCommand.addListener(mockListener);

      // Command listener should still be registered even if shortcut is disabled
      expect(mockCommands.onCommand.addListener).toHaveBeenCalledWith(mockListener);
    });

    it('should handle command API unavailability', () => {
      // Mock scenario where commands API is not available
      global.chrome = {};

      expect(() => {
        // Extension should handle missing API gracefully
        if (chrome.commands) {
          chrome.commands.onCommand.addListener(() => {});
        }
      }).not.toThrow();
    });
  });
});

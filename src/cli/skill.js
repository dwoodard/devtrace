import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../../');
const skillRepoPath = path.join(projectRoot, '.claude/skills/devtrace');
const skillUserPath = path.join(process.env.HOME, '.claude/skills/devtrace');

export async function skillCommand(args) {
  const subcommand = args[0] || 'help';

  switch (subcommand) {
    case 'install':
      installSkill();
      break;
    case 'status':
      statusSkill();
      break;
    case 'update':
      updateSkill();
      break;
    case 'help':
    case '--help':
    case '-h':
      printSkillHelp();
      break;
    default:
      console.error(`Unknown skill command: ${subcommand}`);
      printSkillHelp();
      process.exit(1);
  }
}

function installSkill() {
  if (!fs.existsSync(skillRepoPath)) {
    console.error(chalk.red('Error: Skill not found in project'));
    console.error(`Expected at: ${skillRepoPath}`);
    process.exit(1);
  }

  const skillUserDir = path.dirname(skillUserPath);

  // Ensure ~/.claude/skills exists
  if (!fs.existsSync(skillUserDir)) {
    fs.mkdirSync(skillUserDir, { recursive: true });
  }

  // Remove existing symlink or directory
  if (fs.existsSync(skillUserPath)) {
    try {
      const stat = fs.lstatSync(skillUserPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(skillUserPath);
        console.log(chalk.yellow('Removed old symlink'));
      } else {
        console.error(chalk.red('Error: Skill directory exists but is not a symlink'));
        console.error('Remove it manually: rm -rf ' + skillUserPath);
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red('Error managing existing skill:', err.message));
      process.exit(1);
    }
  }

  // Create relative symlink (portable across machines)
  try {
    // Calculate relative path from ~/.claude/skills to repo
    // Assumes repo is at ~/projects/devtrace
    const relativePath = path.relative(
      path.dirname(skillUserPath),
      skillRepoPath
    );

    fs.symlinkSync(relativePath, skillUserPath);
    console.log(chalk.green('✓ Skill installed successfully'));
    console.log(chalk.blue(`Symlink: ${skillUserPath}`));
    console.log(chalk.blue(`Points to: ${relativePath}`));
    console.log('');
    console.log(chalk.cyan('The skill is now available in Claude Code:'));
    console.log(chalk.cyan('  /devtrace help'));
    console.log(chalk.cyan('  /devtrace start'));
  } catch (err) {
    console.error(chalk.red('Error creating symlink:', err.message));
    process.exit(1);
  }
}

function statusSkill() {
  const skillExists = fs.existsSync(skillRepoPath);
  const skillLinked = fs.existsSync(skillUserPath);

  console.log(chalk.cyan('DevTrace Skill Status:\n'));

  console.log(chalk.blue('Repository:'));
  console.log(`  Path: ${skillRepoPath}`);
  console.log(`  Status: ${skillExists ? chalk.green('✓ Present') : chalk.red('✗ Missing')}`);

  console.log('');
  console.log(chalk.blue('Claude Skills:'));
  console.log(`  Path: ${skillUserPath}`);

  if (skillLinked) {
    const stat = fs.lstatSync(skillUserPath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(skillUserPath);
      console.log(`  Status: ${chalk.green('✓ Installed (symlink)')}`);
      console.log(`  Target: ${target}`);
    } else {
      console.log(`  Status: ${chalk.yellow('⚠ Installed (directory)')}`);
    }
  } else {
    console.log(`  Status: ${chalk.yellow('⚠ Not installed')}`);
    console.log(`  Run: ${chalk.cyan('devtrace skill install')}`);
  }

  console.log('');
  console.log(chalk.cyan('Files:'));

  const files = ['SKILL.md', 'README.md', 'devtrace-helper.sh'];
  files.forEach((file) => {
    const exists = fs.existsSync(path.join(skillRepoPath, file));
    console.log(`  ${file}: ${exists ? chalk.green('✓') : chalk.red('✗')}`);
  });

  console.log('');
  console.log(chalk.cyan('Usage:'));
  console.log('  Once installed, use: /devtrace <command>');
  console.log('  For help: /devtrace help');
}

function updateSkill() {
  console.log(chalk.cyan('Updating skill...'));

  const files = ['SKILL.md', 'README.md', 'devtrace-helper.sh'];
  const skillUserDir = path.dirname(skillUserPath);

  // Ensure ~/.claude/skills exists
  if (!fs.existsSync(skillUserDir)) {
    fs.mkdirSync(skillUserDir, { recursive: true });
  }

  // If symlink exists, just verify it
  if (fs.existsSync(skillUserPath) && fs.lstatSync(skillUserPath).isSymbolicLink()) {
    console.log(chalk.green('✓ Skill is symlinked to repository'));
    console.log(chalk.green('✓ Updates will be automatic (skill is in version control)'));
    return;
  }

  // Otherwise, reinstall
  console.log(chalk.yellow('Reinstalling skill as symlink...'));
  installSkill();
}

function printSkillHelp() {
  console.log(`
${chalk.cyan('DevTrace Skill Management')}

Usage:
  devtrace skill install      Install the skill to ~/.claude/skills
  devtrace skill status       Check installation status
  devtrace skill update       Update the skill
  devtrace skill help         Show this message

What is the DevTrace skill?
  A Claude Code skill that provides easy access to DevTrace.
  It includes commands, documentation, and usage examples.

Installation:
  1. Run: ${chalk.cyan('devtrace skill install')}
  2. Use in Claude Code: ${chalk.cyan('/devtrace help')}

Where is it stored?
  Repository: ${skillRepoPath}
  Linked from: ${skillUserPath}

Why a symlink?
  The skill is stored in version control (GitHub).
  A symlink keeps it in sync automatically.
  When you update the repo, the skill updates too.

Need help?
  devtrace help               Show all commands
  /devtrace help              Show skill commands
  cat ${projectRoot}README.md         Full documentation
  `);
}

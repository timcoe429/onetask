# Project Planner

A minimalist project management app that helps you focus on one task at a time. Built with the philosophy that consistent daily progress beats sporadic bursts of activity.

## Core Concept

- **One task per project per day** - Focus on making steady progress
- **Streak tracking** - Build momentum with daily consistency
- **Gamification** - Earn points and badges for maintaining streaks
- **No overwhelm** - See only what matters today

## Features

### 📋 Project Management
- Create multiple projects with custom icons and colors
- Each project tracks its own streak and progress
- Visual dashboard showing today's task for each project

### ✅ Task System
- One primary task per project per day
- Complete daily task to unlock bonus tasks
- Tasks queue up automatically
- Never runs out - always something to work on

### 🔥 Streak & Badge System
- **Project Streaks**: Track consecutive days of progress per project
- **Global Points**: Accumulate points across all projects
- **Achievement Badges**:
  - 🔥 **On Fire** - 3 day streak
  - ⚡ **Lightning** - 7 day streak  
  - 💎 **Diamond Hands** - 30 day streak
  - 👑 **Legendary** - 100 day streak

### 🎨 Visual Themes
- Dynamic backgrounds that change based on your streak achievements
- Clean, modern interface with smooth animations
- Mobile-responsive design

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Hosting**: Railway (or any Node.js host)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file:
   ```bash
   DATABASE_URL=postgres://user:password@localhost:5432/project_planner
   PORT=3000
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   The database tables will be created automatically on first run.

## Usage

1. **Create Projects**: Click "Add New Project" and give it a name, icon, and color
2. **Add Tasks**: Click on a project to add tasks to its queue
3. **Daily Workflow**: 
   - Open the app each day
   - See one task per project
   - Complete tasks to earn points and maintain streaks
   - Complete bonus tasks if you want to do more

## Database Schema

- `projects` - Stores project information
- `tasks` - All tasks across all projects
- `daily_progress` - Tracks completed tasks by date
- `project_streaks` - Maintains streak counts per project
- `badges` - Achievement definitions
- `project_badges` - Earned badges per project
- `global_stats` - Overall statistics

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects with today's tasks
- `POST /api/projects` - Create new project
- `GET /api/projects/:id/tasks` - Get tasks for a project
- `GET /api/projects/:id/stats` - Get project statistics

### Tasks
- `POST /api/projects/:projectId/tasks` - Add task to project
- `POST /api/tasks/:taskId/complete` - Mark task as complete
- `GET /api/projects/:projectId/next-task` - Get bonus task after completing daily

### Stats
- `GET /api/stats/global` - Get overall statistics

## Philosophy

This app is built on the principle that small, consistent actions compound over time. Instead of overwhelming yourself with huge task lists, focus on moving each project forward by just one task per day. 

The streak system provides motivation to maintain consistency, while the bonus task system allows for productive days without breaking the sustainable pace.

## Future Enhancements

- Task priorities and reordering
- Project archiving
- Statistics and analytics dashboard
- Task templates
- Recurring tasks
- Mobile app

## License

MIT

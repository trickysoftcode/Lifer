import Header from '../components/Header/Header';
import WeeklyChallenges from '../components/Gamification/WeeklyChallenges';
import NewsHub from '../components/News/NewsHub';
import DailyHabits from '../components/Habits/DailyHabits';
import QuickNotes from '../components/Habits/QuickNotes';
import DailyTasks from '../components/Tasks/DailyTasks';
import ImageCarousel from '../components/Focus/ImageCarousel';
import PomodoroTimer from '../components/Focus/PomodoroTimer';
import ProjectDashboard from '../components/Projects/ProjectDashboard';
import FinanceTracker from '../components/Finance/FinanceTracker';
import MediaTracker from '../components/Media/MediaTracker';
import LifePlans from '../components/Plans/LifePlans';
import Wishlist from '../components/Plans/Wishlist';
import AICopilot from '../components/AI/AICopilot';
import ErrorBoundary from '../components/ErrorBoundary';
import './HomePage.css';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="home-page">
        {/* Weekly Challenges Banner */}
        <section className="dashboard-section">
          <WeeklyChallenges />
        </section>

        {/* News Hub + Daily Habits */}
        <section className="dashboard-section">
          <div className="habits-section">
            <NewsHub />
            <DailyHabits />
          </div>
        </section>

        {/* Daily Tasks + Quick Notes (50/50 Split) */}
        <section className="dashboard-section">
          <div className="tasks-notes-split">
            <DailyTasks />
            <QuickNotes />
          </div>
        </section>

        {/* Carousel + Pomodoro */}
        <section className="dashboard-section">
          <div className="focus-section">
            <ImageCarousel />
            <PomodoroTimer />
          </div>
        </section>

        {/* Project Dashboard */}
        <section className="dashboard-section">
          <ProjectDashboard />
        </section>

        {/* Finance Tracker */}
        <section className="dashboard-section">
          <FinanceTracker />
        </section>

        {/* Infotainment Tracker */}
        <section className="dashboard-section">
          <MediaTracker />
        </section>

        {/* Wishlist & Life Plans (30/70 Split) */}
        <section className="dashboard-section">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 7fr', gap: 'var(--space-xl)', alignItems: 'stretch' }}>
            <Wishlist />
            <LifePlans />
          </div>
        </section>
      </main>

      {/* AI Copilot — Floating Panel */}
      <ErrorBoundary>
        <AICopilot />
      </ErrorBoundary>
    </>
  );
}

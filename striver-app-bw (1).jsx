import { useState } from 'react';

// Premier League Club Badges
const PremierLeagueClubs = [
  { id: 'arsenal', name: 'Arsenal', badge: 'https://resources.premierleague.com/premierleague/badges/50/t3.png' },
  { id: 'astonvilla', name: 'Aston Villa', badge: 'https://resources.premierleague.com/premierleague/badges/50/t7.png' },
  { id: 'bournemouth', name: 'Bournemouth', badge: 'https://resources.premierleague.com/premierleague/badges/50/t91.png' },
  { id: 'brentford', name: 'Brentford', badge: 'https://resources.premierleague.com/premierleague/badges/50/t94.png' },
  { id: 'brighton', name: 'Brighton', badge: 'https://resources.premierleague.com/premierleague/badges/50/t36.png' },
  { id: 'chelsea', name: 'Chelsea', badge: 'https://resources.premierleague.com/premierleague/badges/50/t8.png' },
  { id: 'crystalpalace', name: 'Crystal Palace', badge: 'https://resources.premierleague.com/premierleague/badges/50/t31.png' },
  { id: 'everton', name: 'Everton', badge: 'https://resources.premierleague.com/premierleague/badges/50/t11.png' },
  { id: 'fulham', name: 'Fulham', badge: 'https://resources.premierleague.com/premierleague/badges/50/t54.png' },
  { id: 'ipswich', name: 'Ipswich', badge: 'https://resources.premierleague.com/premierleague/badges/50/t40.png' },
  { id: 'leicester', name: 'Leicester', badge: 'https://resources.premierleague.com/premierleague/badges/50/t13.png' },
  { id: 'liverpool', name: 'Liverpool', badge: 'https://resources.premierleague.com/premierleague/badges/50/t14.png' },
  { id: 'mancity', name: 'Man City', badge: 'https://resources.premierleague.com/premierleague/badges/50/t43.png' },
  { id: 'manutd', name: 'Man Utd', badge: 'https://resources.premierleague.com/premierleague/badges/50/t1.png' },
  { id: 'newcastle', name: 'Newcastle', badge: 'https://resources.premierleague.com/premierleague/badges/50/t4.png' },
  { id: 'nottmforest', name: "Nott'm Forest", badge: 'https://resources.premierleague.com/premierleague/badges/50/t17.png' },
  { id: 'southampton', name: 'Southampton', badge: 'https://resources.premierleague.com/premierleague/badges/50/t20.png' },
  { id: 'spurs', name: 'Spurs', badge: 'https://resources.premierleague.com/premierleague/badges/50/t6.png' },
  { id: 'westham', name: 'West Ham', badge: 'https://resources.premierleague.com/premierleague/badges/50/t21.png' },
  { id: 'wolves', name: 'Wolves', badge: 'https://resources.premierleague.com/premierleague/badges/50/t39.png' },
];

// Team Dropdown Component
const TeamDropdown = ({ selected, label = "Favorite team", multiple = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedClubs = multiple 
    ? PremierLeagueClubs.filter(c => selected.includes(c.id))
    : PremierLeagueClubs.filter(c => c.id === selected);
  
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '12px',
        color: '#666',
        marginBottom: '8px',
      }}>{label}</div>
      
      {/* Dropdown Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '52px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          cursor: 'pointer',
          background: '#fff',
          transition: 'border-color 0.2s ease',
        }}
      >
        {selectedClubs.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '-8px' }}>
              {selectedClubs.slice(0, 3).map((club, i) => (
                <div 
                  key={club.id}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: '2px solid #fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    marginLeft: i > 0 ? '-8px' : '0',
                    position: 'relative',
                    zIndex: 3 - i,
                  }}
                >
                  <img 
                    src={club.badge} 
                    alt={club.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ))}
            </div>
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '15px',
              color: '#000',
            }}>
              {selectedClubs.length === 1 
                ? selectedClubs[0].name 
                : `${selectedClubs.length} teams selected`}
            </span>
          </div>
        ) : (
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '15px',
            color: '#999',
          }}>Select {multiple ? 'teams' : 'team'}</span>
        )}
        
        {/* Chevron */}
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#999" 
          strokeWidth="1.5"
          style={{
            marginLeft: 'auto',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          zIndex: 100,
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {PremierLeagueClubs.map((club, i) => {
            const isSelected = selected.includes ? selected.includes(club.id) : selected === club.id;
            return (
              <div 
                key={club.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: isSelected ? '#f8f8f8' : '#fff',
                  borderBottom: i < PremierLeagueClubs.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                }}>
                  <img 
                    src={club.badge} 
                    alt={club.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '14px',
                  color: '#000',
                  flex: 1,
                }}>{club.name}</span>
                {isSelected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Outline Icons - All custom SVG, stroke only
const Icons = {
  back: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clubs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="17" cy="11" r="3"/>
      <path d="M21 21v-1.5a3 3 0 00-3-3h-1"/>
    </svg>
  ),
  camera: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  rewards: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="5"/>
      <path d="M20 21a8 8 0 10-16 0"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  comment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  ),
  share: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  ),
  coin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12M8 10h8M8 14h8"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  flash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  flip: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 2v6h-6"/>
      <path d="M3 22v-6h6"/>
      <path d="M21 8A9 9 0 003 8"/>
      <path d="M3 16a9 9 0 0018 0"/>
    </svg>
  ),
  play: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round"/>
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  news: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 1012 0V2z"/>
    </svg>
  ),
};

// Phone Frame Component
const PhoneFrame = ({ children, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
    <div style={{
      width: '280px',
      height: '580px',
      background: '#fff',
      border: '2px solid #000',
      borderRadius: '44px',
      padding: '8px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        height: '100%',
        background: '#fff',
        borderRadius: '36px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '26px',
          background: '#000',
          borderRadius: '20px',
          zIndex: 100,
        }} />
        {children}
      </div>
    </div>
    <span style={{
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color: '#000',
    }}>{label}</span>
  </div>
);

// Bottom Navigation
const BottomNav = ({ active = 'home' }) => (
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70px',
    background: '#fff',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: '8px',
  }}>
    {[
      { id: 'home', icon: Icons.home },
      { id: 'clubs', icon: Icons.clubs },
      { id: 'camera', icon: Icons.camera },
      { id: 'rewards', icon: Icons.rewards },
      { id: 'profile', icon: Icons.profile },
    ].map((item) => (
      <div
        key={item.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          opacity: active === item.id ? 1 : 0.4,
          transition: 'all 0.2s ease',
        }}
      >
        {item.icon}
        {active === item.id && (
          <div style={{
            width: '4px',
            height: '4px',
            background: '#000',
            borderRadius: '50%',
          }} />
        )}
      </div>
    ))}
  </div>
);

// Welcome Screen
const WelcomeScreen = () => (
  <div style={{
    height: '100%',
    background: 'linear-gradient(180deg, #fff 0%, #f8f8f8 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 40px',
  }}>
    {/* Logo */}
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        border: '2px solid #000',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <span style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '32px',
          fontWeight: '700',
        }}>S</span>
      </div>
      <h1 style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '36px',
        fontWeight: '700',
        letterSpacing: '-1px',
        margin: '0 0 8px 0',
      }}>striver</h1>
      <p style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '14px',
        color: '#666',
        margin: 0,
        letterSpacing: '0.3px',
      }}>join the conversation</p>
    </div>
    
    {/* CTA */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button style={{
        width: '100%',
        height: '52px',
        background: '#000',
        border: 'none',
        borderRadius: '26px',
        color: '#fff',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
      }}>Get Started</button>
      <button style={{
        width: '100%',
        height: '52px',
        background: 'transparent',
        border: '1.5px solid #000',
        borderRadius: '26px',
        color: '#000',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
      }}>I have an account</button>
    </div>
  </div>
);

// Sign Up Screen
const SignUpScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
      {Icons.back}
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '18px',
        fontWeight: '600',
      }}>Create account</span>
    </div>
    
    {/* Social Login */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
      {['f', 'G', '𝕏'].map((icon, i) => (
        <div key={i} style={{
          width: '56px',
          height: '56px',
          border: '1.5px solid #000',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '20px',
          fontWeight: '500',
        }}>{icon}</div>
      ))}
    </div>
    
    {/* Divider */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    }}>
      <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
      <span style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '12px',
        color: '#999',
      }}>or continue with email</span>
      <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
    </div>
    
    {/* Form */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      {['Email address', 'Create password'].map((placeholder, i) => (
        <div key={i} style={{
          height: '52px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '15px',
            color: '#999',
          }}>{placeholder}</span>
        </div>
      ))}
    </div>
    
    {/* CTA */}
    <button style={{
      width: '100%',
      height: '52px',
      background: '#000',
      border: 'none',
      borderRadius: '26px',
      color: '#fff',
      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '24px',
    }}>Continue</button>
  </div>
);

// Verify Screen
const VerifyScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      {Icons.back}
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '18px',
        fontWeight: '600',
      }}>Verify your age</span>
    </div>
    
    {/* Face Scan Area */}
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '140px',
        height: '180px',
        border: '2px dashed #ccc',
        borderRadius: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>position face</span>
      </div>
      <p style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '13px',
        color: '#666',
        textAlign: 'center',
        lineHeight: '1.5',
      }}>We verify age to keep<br />our community safe</p>
    </div>
    
    {/* Steps */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
      {[
        { done: true, text: 'Email verified' },
        { done: false, text: 'Age verification' },
        { done: false, text: 'Create profile' },
      ].map((step, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: '#f8f8f8',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: step.done ? '#000' : 'transparent',
            border: step.done ? 'none' : '1.5px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            {step.done && Icons.check}
          </div>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '14px',
            color: step.done ? '#000' : '#666',
          }}>{step.text}</span>
        </div>
      ))}
    </div>
    
    <button style={{
      width: '100%',
      height: '52px',
      background: '#000',
      border: 'none',
      borderRadius: '26px',
      color: '#fff',
      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
    }}>Start Scan</button>
  </div>
);

// Profile Child (4-13) - Parent Controlled
const ProfileChildScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      {Icons.back}
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '18px',
        fontWeight: '600',
      }}>Create profile</span>
      <div style={{
        marginLeft: 'auto',
        padding: '4px 10px',
        background: '#f0f0f0',
        borderRadius: '12px',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '11px',
        fontWeight: '600',
      }}>4-13</div>
    </div>
    
    {/* Avatar Upload */}
    <div style={{
      width: '80px',
      height: '80px',
      border: '2px dashed #ccc',
      borderRadius: '50%',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>{Icons.plus}</div>
    
    {/* Form Fields */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        height: '52px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '15px',
          color: '#999',
        }}>Display name</span>
      </div>
      
      {/* Favorite Team */}
      <TeamDropdown selected="liverpool" label="Favorite team" />
    </div>
    
    {/* Parent Control Box */}
    <div style={{
      marginTop: '20px',
      padding: '16px',
      background: '#f8f8f8',
      borderRadius: '16px',
      border: '1.5px solid #e8e8e8',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#000',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '15px',
          fontWeight: '600',
        }}>Parent Controls Required</span>
      </div>
      <p style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.5',
        margin: '0 0 12px 0',
      }}>A parent or guardian must approve this account. We'll send a verification link.</p>
      <div style={{
        height: '48px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#fff',
      }}>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '14px',
          color: '#999',
        }}>Parent's email address</span>
      </div>
    </div>
    
    {/* Safety Features */}
    <div style={{ marginTop: '16px' }}>
      <div style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '11px',
        color: '#999',
        letterSpacing: '0.5px',
        marginBottom: '10px',
      }}>SAFETY FEATURES</div>
      {[
        { icon: '👁', text: 'All content pre-moderated' },
        { icon: '💬', text: 'No direct messaging' },
        { icon: '📍', text: 'Location always hidden' },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 0',
        }}>
          <span style={{ fontSize: '14px' }}>{item.icon}</span>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '13px',
            color: '#666',
          }}>{item.text}</span>
        </div>
      ))}
    </div>
    
    <button style={{
      width: '100%',
      height: '52px',
      background: '#000',
      border: 'none',
      borderRadius: '26px',
      color: '#fff',
      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: 'auto',
    }}>Send Parent Invite</button>
  </div>
);

// Profile Teen (14-17) - Monitored Account
const ProfileTeenScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      {Icons.back}
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '18px',
        fontWeight: '600',
      }}>Create profile</span>
      <div style={{
        marginLeft: 'auto',
        padding: '4px 10px',
        background: '#f0f0f0',
        borderRadius: '12px',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '11px',
        fontWeight: '600',
      }}>14-17</div>
    </div>
    
    {/* Avatar Upload */}
    <div style={{
      width: '80px',
      height: '80px',
      border: '2px dashed #ccc',
      borderRadius: '50%',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>{Icons.plus}</div>
    
    {/* Form Fields */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {['Username', 'Display name'].map((placeholder, i) => (
        <div key={i} style={{
          height: '52px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '15px',
            color: '#999',
          }}>{placeholder}</span>
        </div>
      ))}
      
      {/* Favorite Team */}
      <TeamDropdown selected="chelsea" label="Favorite team" />
      
      {/* Bio */}
      <div style={{
        height: '80px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '12px',
        padding: '14px 16px',
      }}>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '15px',
          color: '#999',
        }}>Bio (optional)</span>
      </div>
    </div>
    
    {/* Monitored Notice */}
    <div style={{
      marginTop: '16px',
      padding: '14px 16px',
      background: '#f8f8f8',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        background: '#000',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '4px',
        }}>Monitored Account</div>
        <p style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          color: '#666',
          lineHeight: '1.4',
          margin: 0,
        }}>Enhanced safety features are enabled. Some content may be restricted.</p>
      </div>
    </div>
    
    {/* Feature Toggles */}
    <div style={{ marginTop: '16px' }}>
      {[
        { text: 'DMs from followed only', enabled: true },
        { text: 'Hide from search', enabled: false },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: i === 0 ? '1px solid #f0f0f0' : 'none',
        }}>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '14px',
          }}>{item.text}</span>
          <div style={{
            width: '44px',
            height: '26px',
            background: item.enabled ? '#000' : '#e0e0e0',
            borderRadius: '13px',
            position: 'relative',
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              background: '#fff',
              borderRadius: '50%',
              position: 'absolute',
              top: '2px',
              left: item.enabled ? '20px' : '2px',
              transition: 'left 0.2s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
    
    <button style={{
      width: '100%',
      height: '52px',
      background: '#000',
      border: 'none',
      borderRadius: '26px',
      color: '#fff',
      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: 'auto',
    }}>Create Account</button>
  </div>
);

// Profile Adult (18+) - Full Account
const ProfileAdultScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '60px 24px 32px',
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      {Icons.back}
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '18px',
        fontWeight: '600',
      }}>Create profile</span>
      <div style={{
        marginLeft: 'auto',
        padding: '4px 10px',
        background: '#000',
        color: '#fff',
        borderRadius: '12px',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '11px',
        fontWeight: '600',
      }}>18+</div>
    </div>
    
    {/* Avatar Upload */}
    <div style={{
      width: '80px',
      height: '80px',
      border: '2px dashed #ccc',
      borderRadius: '50%',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>{Icons.plus}</div>
    
    {/* Form Fields */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {['Username', 'Display name'].map((placeholder, i) => (
        <div key={i} style={{
          height: '52px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '15px',
            color: '#999',
          }}>{placeholder}</span>
        </div>
      ))}
      
      {/* Favorite Teams */}
      <TeamDropdown selected={['manutd', 'arsenal']} label="Favorite teams" multiple={true} />
      
      {/* Bio */}
      <div style={{
        height: '80px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '12px',
        padding: '14px 16px',
      }}>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '15px',
          color: '#999',
        }}>Bio</span>
      </div>
      
      {/* Location */}
      <div style={{
        height: '52px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '10px',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '15px',
          color: '#999',
        }}>Location (optional)</span>
      </div>
    </div>
    
    {/* Full Access Badge */}
    <div style={{
      marginTop: '16px',
      padding: '14px 16px',
      background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        background: '#000',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '2px',
        }}>Full Access Unlocked</div>
        <p style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          color: '#666',
          margin: 0,
        }}>All features • Go live • Monetization</p>
      </div>
    </div>
    
    {/* Creator Toggle */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      marginTop: '8px',
    }}>
      <div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '14px',
          fontWeight: '500',
        }}>Enable Creator Mode</div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          color: '#999',
        }}>Analytics, tips & more</div>
      </div>
      <div style={{
        width: '44px',
        height: '26px',
        background: '#000',
        borderRadius: '13px',
        position: 'relative',
      }}>
        <div style={{
          width: '22px',
          height: '22px',
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: '20px',
        }} />
      </div>
    </div>
    
    <button style={{
      width: '100%',
      height: '52px',
      background: '#000',
      border: 'none',
      borderRadius: '26px',
      color: '#fff',
      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: 'auto',
    }}>Create Account</button>
  </div>
);

// Home Feed Screen
const HomeFeedScreen = () => (
  <div style={{
    height: '100%',
    background: '#f5f5f5',
    position: 'relative',
  }}>
    {/* Video Background */}
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.3,
      }}>
        {Icons.play}
      </div>
    </div>
    
    {/* Top Bar */}
    <div style={{
      position: 'absolute',
      top: '50px',
      left: 0,
      right: 0,
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        background: '#000',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '14px',
        fontWeight: '700',
      }}>S</div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {Icons.search}
        {Icons.bell}
      </div>
    </div>
    
    {/* Sidebar Actions */}
    <div style={{
      position: 'absolute',
      right: '12px',
      top: '110px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      {/* FIFA Card */}
      <div style={{
        width: '52px',
        height: '72px',
        background: '#fff',
        border: '1.5px solid #000',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '10px',
        fontWeight: '600',
      }}>FIFA</div>
      
      {/* Coins */}
      <div style={{
        padding: '6px 10px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {Icons.coin}
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '11px',
          fontWeight: '600',
        }}>750</span>
      </div>
      
      {/* Actions */}
      {[Icons.heart, Icons.comment, Icons.share].map((icon, i) => (
        <div key={i} style={{
          width: '40px',
          height: '40px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>{icon}</div>
      ))}
    </div>
    
    {/* Bottom Content */}
    <div style={{
      position: 'absolute',
      bottom: '80px',
      left: 0,
      right: '70px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          background: '#000',
          borderRadius: '50%',
        }} />
        <span style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '13px',
          fontWeight: '600',
        }}>@mbappe_fan92</span>
      </div>
      <p style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '13px',
        lineHeight: '1.4',
        margin: '0 0 8px 0',
      }}>That goal was absolutely insane 🔥 Best player in the world rn</p>
      
      {/* Progress */}
      <div style={{
        height: '3px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '2px',
        marginTop: '12px',
      }}>
        <div style={{
          width: '35%',
          height: '100%',
          background: '#000',
          borderRadius: '2px',
        }} />
      </div>
    </div>
    
    <BottomNav active="home" />
  </div>
);

// Responses Thread Screen
const ResponsesScreen = () => {
  const comments = [
    { id: 1, user: '@carlos_rm7', avatar: 'C', time: '2m', text: 'Ronaldo is the GOAT and here\'s why...', likes: 234, isVideo: true },
    { id: 2, user: '@messifc10', avatar: 'M', time: '5m', text: 'Messi has more assists, more goals in finals, more everything 🐐', likes: 189, isVideo: true },
    { id: 3, user: '@ballon_dor', avatar: 'B', time: '8m', text: 'Both legends, but different eras different game', likes: 156, isVideo: false },
    { id: 4, user: '@prem_fanatic', avatar: 'P', time: '12m', text: 'The Premier League made both of them tbh', likes: 98, isVideo: true },
    { id: 5, user: '@laliga_stan', avatar: 'L', time: '15m', text: 'Ronaldo UCL record speaks for itself 🏆', likes: 312, isVideo: true },
    { id: 6, user: '@futbol_daily', avatar: 'F', time: '18m', text: 'This debate will never end and I\'m here for it', likes: 67, isVideo: false },
  ];

  return (
    <div style={{
      height: '100%',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '50px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        {Icons.back}
        <span style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '16px',
          fontWeight: '600',
        }}>Responses</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          color: '#999',
        }}>342 replies</span>
      </div>
      
      {/* Original Post */}
      <div style={{
        margin: '12px 16px',
        padding: '12px',
        background: '#f8f8f8',
        borderRadius: '12px',
        display: 'flex',
        gap: '12px',
      }}>
        <div style={{
          width: '48px',
          height: '64px',
          background: 'linear-gradient(135deg, #e0e0e0 0%, #c8c8c8 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {Icons.play}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              background: '#000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '600',
            }}>R</div>
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '13px',
              fontWeight: '600',
            }}>@rio_ferdinand</span>
            <span style={{
              background: '#000',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: '600',
            }}>LEGEND</span>
          </div>
          <div style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '2px',
          }}>Messi vs Ronaldo - The GOAT Debate</div>
          <div style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '12px',
            color: '#666',
          }}>Who's the greatest of all time? Drop your hot take!</div>
        </div>
      </div>
      
      {/* Comments Thread */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px',
      }}>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '11px',
          color: '#999',
          letterSpacing: '0.5px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>RESPONSES</span>
          <div style={{ flex: 1, height: '1px', background: '#f0f0f0' }} />
          <span>Newest first</span>
        </div>
        
        {comments.map((comment, index) => (
          <div 
            key={comment.id}
            style={{
              display: 'flex',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '14px',
              borderBottom: index < comments.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              background: comment.isVideo ? '#000' : '#e0e0e0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: comment.isVideo ? '#fff' : '#666',
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '14px',
              fontWeight: '600',
              flexShrink: 0,
            }}>
              {comment.avatar}
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '13px',
                  fontWeight: '600',
                }}>{comment.user}</span>
                {comment.isVideo && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span style={{
                      fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                      fontSize: '9px',
                      fontWeight: '500',
                    }}>VIDEO</span>
                  </div>
                )}
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '11px',
                  color: '#999',
                  marginLeft: 'auto',
                }}>{comment.time}</span>
              </div>
              
              <p style={{
                fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                fontSize: '13px',
                lineHeight: '1.4',
                margin: '0 0 8px 0',
                color: '#333',
              }}>{comment.text}</p>
              
              {/* Video Preview (if video response) */}
              {comment.isVideo && (
                <div style={{
                  width: '100%',
                  height: '120px',
                  background: 'linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                    fontSize: '10px',
                  }}>0:45</span>
                </div>
              )}
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#666',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  <span style={{
                    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                    fontSize: '12px',
                  }}>{comment.likes}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#666',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                  </svg>
                  <span style={{
                    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                    fontSize: '12px',
                  }}>Reply</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Reply Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#fff',
      }}>
        <div style={{
          flex: 1,
          height: '44px',
          background: '#f5f5f5',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '14px',
            color: '#999',
          }}>Add your response...</span>
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          background: '#000',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Camera Screen
const CameraScreen = () => (
  <div style={{
    height: '100%',
    background: '#f5f5f5',
    position: 'relative',
  }}>
    {/* Top Controls */}
    <div style={{
      position: 'absolute',
      top: '50px',
      left: 0,
      right: 0,
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>{Icons.back}</div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>{Icons.flash}</div>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>{Icons.flip}</div>
      </div>
    </div>
    
    {/* Timer */}
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <span style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '48px',
        fontWeight: '200',
        letterSpacing: '-2px',
        color: '#999',
      }}>0:00</span>
    </div>
    
    {/* Bottom Controls */}
    <div style={{
      position: 'absolute',
      bottom: '50px',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '32px',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        background: '#fff',
        border: '1.5px solid #e0e0e0',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>{Icons.grid}</div>
      
      {/* Record Button */}
      <div style={{
        width: '72px',
        height: '72px',
        border: '3px solid #000',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#000',
          borderRadius: '50%',
        }} />
      </div>
      
      <div style={{ width: '44px' }} />
    </div>
  </div>
);

// Profile Screen
const ProfileScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{
      padding: '50px 16px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {Icons.settings}
      {Icons.grid}
    </div>
    
    {/* Profile Info */}
    <div style={{
      padding: '0 16px 16px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: '#f0f0f0',
        border: '2px solid #000',
        borderRadius: '50%',
      }} />
      <div>
        <div style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '4px',
        }}>alex_striker</div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '13px',
          color: '#666',
        }}>Real Madrid • London</div>
      </div>
    </div>
    
    {/* Stats */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      padding: '0 16px 16px',
    }}>
      {[
        { num: '1.2K', label: 'Followers' },
        { num: '450', label: 'Following' },
        { num: '234', label: 'Replies' },
        { num: '750', label: 'Coins' },
      ].map((stat, i) => (
        <div key={i} style={{
          background: '#f8f8f8',
          borderRadius: '12px',
          padding: '12px 8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '2px',
          }}>{stat.num}</div>
          <div style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '10px',
            color: '#999',
          }}>{stat.label}</div>
        </div>
      ))}
    </div>
    
    {/* Tabs */}
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #f0f0f0',
    }}>
      {['Videos', 'Replies', 'Challenges', 'Coins'].map((tab, i) => (
        <div key={i} style={{
          flex: 1,
          padding: '12px',
          textAlign: 'center',
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '12px',
          fontWeight: i === 0 ? '600' : '400',
          color: i === 0 ? '#000' : '#999',
          borderBottom: i === 0 ? '2px solid #000' : '2px solid transparent',
        }}>{tab}</div>
      ))}
    </div>
    
    {/* Video Grid */}
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1px',
      background: '#f0f0f0',
    }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          background: '#e8e8e8',
          aspectRatio: '1',
        }} />
      ))}
    </div>
    
    <BottomNav active="profile" />
  </div>
);

// Fan Clubs Screen
const FanClubsScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{ padding: '50px 16px 12px' }}>
      <div style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '16px',
      }}>Fan Clubs</div>
      
      {/* Team Scroll */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {PremierLeagueClubs.slice(0, 5).map((club, i) => (
          <div key={club.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              background: '#fff',
              borderRadius: '50%',
              border: i === 0 ? '2px solid #000' : '1.5px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
            }}>
              <img 
                src={club.badge} 
                alt={club.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '10px',
              color: i === 0 ? '#000' : '#999',
              maxWidth: '52px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{club.name}</span>
          </div>
        ))}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: '#f8f8f8',
            border: '1.5px dashed #ccc',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>{Icons.plus}</div>
          <span style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '10px',
            color: '#999',
          }}>Add</span>
        </div>
      </div>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['All', 'Videos', 'Hot Takes'].map((filter, i) => (
          <div key={i} style={{
            padding: '8px 16px',
            background: i === 0 ? '#000' : '#f0f0f0',
            color: i === 0 ? '#fff' : '#666',
            borderRadius: '20px',
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '12px',
            fontWeight: '500',
          }}>{filter}</div>
        ))}
      </div>
    </div>
    
    {/* Posts */}
    <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
      {[
        { user: '@gunner_4life', team: 'arsenal', text: 'Saka is the best young player in the world right now 🔴⚪', likes: '1.2K', comments: 234 },
        { user: '@ynwa_forever', team: 'liverpool', text: 'Anfield under the lights hits different 🔴', likes: '2.1K', comments: 456 },
      ].map((post, i) => {
        const club = PremierLeagueClubs.find(c => c.id === post.team);
        return (
          <div key={i} style={{
            border: '1px solid #f0f0f0',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}>
            <div style={{
              height: '140px',
              background: 'linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%)',
              position: 'relative',
            }}>
              {/* Club badge overlay */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '32px',
                height: '32px',
                background: '#fff',
                borderRadius: '50%',
                padding: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                <img 
                  src={club?.badge} 
                  alt={club?.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: '#000',
                  borderRadius: '50%',
                }} />
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '13px',
                  fontWeight: '600',
                }}>{post.user}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '11px',
                  color: '#999',
                }}>2h</span>
              </div>
              <p style={{
                fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                fontSize: '13px',
                margin: '0 0 8px 0',
                lineHeight: '1.4',
              }}>{post.text}</p>
              <div style={{
                display: 'flex',
                gap: '16px',
              }}>
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '12px',
                  color: '#666',
                }}>❤️ {post.likes}</span>
                <span style={{
                  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
                  fontSize: '12px',
                  color: '#666',
                }}>💬 {post.comments}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    
    <BottomNav active="clubs" />
  </div>
);

// Rewards Screen
const RewardsScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{ padding: '50px 16px 16px' }}>
      {/* Coin Card */}
      <div style={{
        background: '#f8f8f8',
        borderRadius: '20px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '11px',
          color: '#666',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>GOLD TIER</div>
        <div style={{
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          fontSize: '36px',
          fontWeight: '600',
          marginBottom: '12px',
        }}>750</div>
        <div style={{
          height: '4px',
          background: '#e0e0e0',
          borderRadius: '2px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '75%',
            height: '100%',
            background: '#000',
            borderRadius: '2px',
          }} />
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '11px',
          color: '#999',
        }}>250 more to Platinum</div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['Earn', 'Spend', 'Tiers'].map((tab, i) => (
          <div key={i} style={{
            padding: '10px 20px',
            background: i === 0 ? '#000' : '#f0f0f0',
            color: i === 0 ? '#fff' : '#666',
            borderRadius: '20px',
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '13px',
            fontWeight: '500',
          }}>{tab}</div>
        ))}
      </div>
    </div>
    
    {/* Activities */}
    <div style={{ flex: 1, padding: '0 16px' }}>
      <div style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '11px',
        color: '#999',
        letterSpacing: '0.5px',
        marginBottom: '12px',
      }}>DAILY ACTIVITIES</div>
      
      {[
        { title: 'Watch 5 videos', desc: 'Complete to earn coins', reward: '+10' },
        { title: 'Post a response', desc: 'Share your hot take', reward: '+5' },
        { title: 'Join a squad', desc: 'Find your community', reward: '+15' },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px',
          background: '#f8f8f8',
          borderRadius: '14px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: '#e8e8e8',
            borderRadius: '10px',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '2px',
            }}>{item.title}</div>
            <div style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '12px',
              color: '#999',
            }}>{item.desc}</div>
          </div>
          <div style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: '14px',
            fontWeight: '600',
          }}>{item.reward}</div>
        </div>
      ))}
    </div>
    
    <BottomNav active="rewards" />
  </div>
);

// Legends Screen
const LegendsScreen = () => (
  <div style={{
    height: '100%',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {/* Hero */}
    <div style={{
      padding: '50px 16px 20px',
      background: '#f8f8f8',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        background: '#000',
        color: '#fff',
        borderRadius: '12px',
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        marginBottom: '16px',
      }}>LEGEND</div>
      
      <div style={{
        width: '72px',
        height: '72px',
        background: '#e0e0e0',
        border: '3px solid #000',
        borderRadius: '50%',
        margin: '0 auto 12px',
      }} />
      
      <div style={{
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px',
      }}>Rio Ferdinand</div>
      <div style={{
        fontFamily: "'SF Pro Text', -apple-system, sans-serif",
        fontSize: '13px',
        color: '#666',
        marginBottom: '16px',
      }}>Manchester United • England</div>
      
      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
      }}>
        {[
          { num: '22', label: 'Trophies' },
          { num: '125', label: 'Caps' },
          { num: '11', label: 'Goals' },
        ].map((stat, i) => (
          <div key={i}>
            <div style={{
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              fontSize: '20px',
              fontWeight: '600',
            }}>{stat.num}</div>
            <div style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '10px',
              color: '#999',
            }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Tabs */}
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #f0f0f0',
    }}>
      {['Challenges', 'Replies'].map((tab, i) => (
        <div key={i} style={{
          flex: 1,
          padding: '14px',
          textAlign: 'center',
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          fontSize: '13px',
          fontWeight: i === 0 ? '600' : '400',
          color: i === 0 ? '#000' : '#999',
          borderBottom: i === 0 ? '2px solid #000' : '2px solid transparent',
        }}>{tab}</div>
      ))}
    </div>
    
    {/* Challenge Card */}
    <div style={{ flex: 1, padding: '16px' }}>
      <div style={{
        border: '1px solid #f0f0f0',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '140px',
          background: 'linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {Icons.trophy}
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '11px',
              fontWeight: '600',
            }}>Challenge</span>
          </div>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
          }}>Best Defender Debate</div>
          <p style={{
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.4',
            margin: '0 0 12px 0',
          }}>Was Rio the best defender of his generation? Drop your hot take!</p>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '12px',
              color: '#666',
            }}>🎥 2.3K entries</span>
            <span style={{
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '12px',
              color: '#666',
            }}>🏆 500 coins</span>
          </div>
          <button style={{
            width: '100%',
            height: '44px',
            background: '#000',
            border: 'none',
            borderRadius: '22px',
            color: '#fff',
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>Join Challenge</button>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component
export default function StriverApp() {
  const [activeScreen, setActiveScreen] = useState('all');
  
  const screens = [
    { id: 'welcome', component: <WelcomeScreen />, label: 'Welcome' },
    { id: 'signup', component: <SignUpScreen />, label: 'Sign Up' },
    { id: 'verify', component: <VerifyScreen />, label: 'Verify Age' },
    { id: 'profile-child', component: <ProfileChildScreen />, label: 'Profile (4-13)' },
    { id: 'profile-teen', component: <ProfileTeenScreen />, label: 'Profile (14-17)' },
    { id: 'profile-adult', component: <ProfileAdultScreen />, label: 'Profile (18+)' },
    { id: 'feed', component: <HomeFeedScreen />, label: 'Home Feed' },
    { id: 'responses', component: <ResponsesScreen />, label: 'Responses' },
    { id: 'camera', component: <CameraScreen />, label: 'Camera' },
    { id: 'profile', component: <ProfileScreen />, label: 'Profile' },
    { id: 'fanclubs', component: <FanClubsScreen />, label: 'Fan Clubs' },
    { id: 'rewards', component: <RewardsScreen />, label: 'Rewards' },
    { id: 'legends', component: <LegendsScreen />, label: 'Legends' },
  ];
  
  const filteredScreens = activeScreen === 'all' 
    ? screens 
    : screens.filter(s => s.id === activeScreen);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px 32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          letterSpacing: '-1px',
          margin: '0 0 8px 0',
          color: '#000',
        }}>Striver</h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0,
        }}>Football Social App • Black & White</p>
      </div>
      
      {/* Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 24px 40px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {[{ id: 'all', label: 'All Screens' }, ...screens].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            style={{
              padding: '10px 18px',
              background: activeScreen === item.id ? '#000' : '#fff',
              color: activeScreen === item.id ? '#fff' : '#000',
              border: '1.5px solid #000',
              borderRadius: '24px',
              fontFamily: "'SF Pro Text', -apple-system, sans-serif",
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      
      {/* Phone Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '40px',
        padding: '0 24px 80px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {filteredScreens.map((screen) => (
          <PhoneFrame key={screen.id} label={screen.label}>
            {screen.component}
          </PhoneFrame>
        ))}
      </div>
    </div>
  );
}

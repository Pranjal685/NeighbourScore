import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [
        # Cards -> glass-card style
        ("background: 'var(--bg-surface)'", "background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        ("background: '#111827'", "background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        ("background: '#161B22'", "background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        ("background: 'var(--bg-card, #161B22)'", "background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        ("backgroundColor: 'var(--bg-surface)'", "backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        ("backgroundColor: '#111827'", "backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)'"),
        
        # Transparent backgrounds
        ("background: 'var(--bg-base)'", "background: 'transparent'"),
        ("background: '#0A0E14'", "background: 'transparent'"),
        ("background: '#0D1117'", "background: 'transparent'"),
        ("backgroundColor: 'var(--bg-base)'", "backgroundColor: 'transparent'"),
        ("backgroundColor: '#0D1117'", "backgroundColor: 'transparent'"),
        
        # Borders
        ("border: '1px solid var(--border)'", "border: '1px solid rgba(255,255,255,0.85)'"),
        ("border: '1px solid #1E293B'", "border: '1px solid rgba(255,255,255,0.85)'"),
        ("border: '1px solid rgba(240,246,252,0.08)'", "border: '1px solid rgba(255,255,255,0.85)'"),
        ("border: '1px solid rgba(240,246,252,0.04)'", "border: '1px solid rgba(0,0,0,0.04)'"),
        ("boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,168,23,0.06)'", "boxShadow: '0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)'"),
        
        # RGBs manually handled
        ("rgba(240,246,252,0.06)", "rgba(0,0,0,0.06)"),
        ("rgba(240,246,252,0.05)", "rgba(0,0,0,0.08)"), # Specifically for the ScoreGauge track
        ("rgba(240, 246, 252, 0.06)", "rgba(0, 0, 0, 0.06)"),
        ("rgba(240,246,252,0.07)", "rgba(0,0,0,0.08)"),
        
        # Tailwind classes that might be sneaking in
        ("bg-[#0D1117]", "bg-transparent"),
        ("bg-[#111827]", "glass-card"),
        ("bg-[#161B22]", "glass-card"),
        ("text-[#F1F5F9]", "text-[#1A1A2E]"),
        ("text-[#E6EDF3]", "text-[#1A1A2E]"),

        # React Inline Variables mappings (Colors)
        ("color: 'var(--text-primary)'", "color: '#1A1A2E'"),
        ("color: 'var(--text-secondary)'", "color: '#64748B'"),
        ("color: 'var(--text-muted)'", "color: '#94A3B8'"),
        ("color: 'var(--text-hint)'", "color: 'rgba(26,26,46,0.3)'"),
        ("fill=\"#484F58\"", "fill=\"#94A3B8\""),
        ("color: '#F1F5F9'", "color: '#1A1A2E'"),
        ("color: '#E6EDF3'", "color: '#1A1A2E'"),
        ("color: '#8B949E'", "color: '#64748B'"),
        ("color: '#475569'", "color: '#94A3B8'"),
        ("color: '#484F58'", "color: '#94A3B8'"),
        
        # Replace Hex Codes inline (temp swap for 64748B vs 94A3B8 issue)
        ("'#F1F5F9'", "'#1A1A2E'"),
        ("'#E6EDF3'", "'#1A1A2E'"),
        ("'#8B949E'", "'#64748B'"),
        ("'#484F58'", "'#94A3B8'"),
        ("'#475569'", "'#94A3B8'"),
        ("'#64748B'", "TEMP_64748B"),
        ("'#94A3B8'", "TEMP_94A3B8"),
        
        # Colors inside strings without quotes like in strings / template literals
        ("#F1F5F9", "#1A1A2E"),
        ("#E6EDF3", "#1A1A2E"),
        ("#8B949E", "#64748B"),
        ("#484F58", "#94A3B8"),
        ("#475569", "#94A3B8"),
    ]

    for old, new in replacements:
        content = content.replace(old, new)
        
    # Swap temps
    content = content.replace("TEMP_64748B", "'#94A3B8'")
    content = content.replace("TEMP_94A3B8", "'#64748B'")

    # Special MapView replacement:
    if "MapView.jsx" in filepath:
        # replace darkMapStyles with lightMapStyles
        new_map_styles = """const lightMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d5e8d4" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
];"""
        # If it has darkMapStyles, replace it by regex or simple text 
        import re
        content = re.sub(r'const darkMapStyles = \[\s*\{[\s\S]*?\];', new_map_styles, content)
        content = content.replace("styles: darkMapStyles", "styles: lightMapStyles")

    # RadarChart Custom Replacements
    if "RadarChart.jsx" in filepath:
        content = content.replace("strokeDasharray: '4 4'", "strokeDasharray: '4 4'") # Just a placeholder
        # Grid lines
        content = content.replace("stroke=\"rgba(240,246,252,0.06)\"", "stroke=\"rgba(0,0,0,0.08)\"")
        content = content.replace("stroke=\"#484F58\"", "stroke=\"rgba(0,0,0,0.08)\"")
        content = content.replace("fill=\"#8B949E\"", "fill=\"#94A3B8\"")
        content = content.replace("rgba(230,168,23,0.1)", "rgba(99,102,241,0.2)") # Fill
        content = content.replace("rgba(230,168,23,0.2)", "rgba(99,102,241,0.2)")
        content = content.replace("'#E6A817'", "'#6366F1'") # Stroke
        

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

dirs = ['c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/components', 'c:/Users/Pranjal/OneDrive/Desktop/NeighbourScore/frontend/src/pages']
for d in dirs:
    for filepath in glob.glob(os.path.join(d, '*.jsx')):
        process_file(filepath)
        
print("Transformation completed.")

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5ff'
  },
  keyboardAvoidingView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },
  pageStack: {
    gap: 12
  },
  heroCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    backgroundColor: 'rgba(244,251,255,0.72)',
    padding: 16,
    shadowColor: '#5f7ea7',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  heroEyebrow: {
    color: '#486b99',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 11
  },
  heroTitle: {
    color: '#1f2e40',
    fontWeight: '900',
    fontSize: 34
  },
  heroSubtitle: {
    color: '#536b86',
    lineHeight: 21,
    marginTop: 4
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(248,253,255,0.62)',
    shadowColor: '#6083ac',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  metricLabel: {
    color: '#5d7794',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  metricValue: {
    color: '#213246',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2
  },
  infoRow: {
    gap: 3,
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(171,203,236,0.34)'
  },
  infoLabel: {
    color: '#5878a3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  infoValue: {
    color: '#4b6078',
    lineHeight: 20
  },
  glassCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    backgroundColor: 'rgba(245,251,255,0.64)',
    padding: 16,
    gap: 12,
    shadowColor: '#5f82ac',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  cardTitle: {
    color: '#23364c',
    fontWeight: '800',
    fontSize: 20
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    color: '#4f6782',
    fontWeight: '700'
  },
  authInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfe2f6',
    backgroundColor: 'rgba(255,255,255,0.78)',
    color: '#203244',
    padding: 12
  },
  primaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f6d9d',
    backgroundColor: '#4f7fb2',
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#4b6f99',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  primaryButtonText: {
    color: '#f2f8ff',
    fontWeight: '800'
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cee1f5',
    backgroundColor: 'rgba(237,247,255,0.78)',
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#6a8db5',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  secondaryButtonText: {
    color: '#446587',
    fontWeight: '700'
  },
  placeholderList: {
    marginTop: 4,
    gap: 6
  },
  placeholderItem: {
    color: '#58708a'
  },
  answerText: {
    color: '#445d78',
    lineHeight: 22
  },
  citationList: {
    gap: 10
  },
  citationItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(171,203,236,0.34)',
    paddingBottom: 8
  },
  citationTitle: {
    color: '#22364d',
    fontWeight: '800'
  },
  citationMeta: {
    color: '#6483a6',
    fontSize: 12,
    marginTop: 2
  },
  exerciseChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  exerciseChip: {
    borderWidth: 1,
    borderColor: '#d4e5f7',
    backgroundColor: 'rgba(239,248,255,0.86)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  exerciseChipActive: {
    backgroundColor: '#4f7fb2',
    borderColor: '#3f6d9d'
  },
  exerciseChipText: {
    color: '#4f6e8f',
    fontWeight: '700',
    fontSize: 12
  },
  exerciseChipTextActive: {
    color: '#f3f9ff'
  },
  textarea: {
    minHeight: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfe2f6',
    backgroundColor: 'rgba(255,255,255,0.78)',
    color: '#1f3244',
    textAlignVertical: 'top',
    padding: 12
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
    marginTop: 10,
    marginBottom: 10
  },
  promptPill: {
    borderWidth: 1,
    borderColor: '#d4e5f7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(240,249,255,0.82)'
  },
  promptPillText: {
    color: '#4d6d8f',
    fontSize: 12,
    fontWeight: '700'
  },
  runButtonDisabled: {
    backgroundColor: '#b8c8db',
    borderColor: '#b8c8db'
  },
  runButtonContainer: {
    position: 'relative',
    marginTop: 2
  },
  runButtonRunning: {
    backgroundColor: '#db754d',
    borderColor: '#c9643f',
    shadowColor: '#d56b45',
    shadowOpacity: 0.36,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5
  },
  runButtonTrail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2
  },
  runButtonTrailInner: {
    borderColor: 'rgba(227,122,79,0.68)'
  },
  runButtonTrailOuter: {
    borderColor: 'rgba(227,122,79,0.45)'
  },
  errorText: {
    color: '#c03131',
    fontWeight: '700',
    marginTop: 10
  },
  countdownText: {
    color: '#2c435d',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center'
  },
  demoWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d3e4f7',
    backgroundColor: 'rgba(241,249,255,0.86)',
    overflow: 'hidden'
  },
  demoLabel: {
    color: '#5b7ba0',
    fontWeight: '700',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(48,66,91,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e7f8',
    backgroundColor: 'rgba(245,252,255,0.96)',
    padding: 16,
    gap: 8
  },
  modalTitle: {
    color: '#22364d',
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 4
  },
  modalLine: {
    color: '#4d6580',
    lineHeight: 20
  },
  cameraPreviewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d2e4f7',
    minHeight: 220,
    backgroundColor: '#e8f2fb'
  },
  cameraPreview: {
    width: '100%',
    height: 220
  },
  codeTitle: {
    color: '#5c7da2',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 6
  },
  codeBlock: {
    backgroundColor: '#edf5fd',
    borderWidth: 1,
    borderColor: '#d1e3f6',
    borderRadius: 10,
    padding: 10,
    color: '#3f5974',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Courier'
  },
  bottomNavWrap: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: 'transparent'
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(244,251,255,0.76)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#6688af',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 52,
    borderRadius: 14
  },
  bottomNavText: {
    color: '#6683a2',
    fontSize: 13,
    fontWeight: '700'
  },
  bottomNavTextActive: {
    color: '#2f6296',
    fontWeight: '900'
  },
  blobOne: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(142,214,255,0.2)'
  },
  blobTwo: {
    position: 'absolute',
    top: 220,
    left: -80,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: 'rgba(197,167,255,0.16)'
  },
  blobThree: {
    position: 'absolute',
    bottom: -120,
    right: 20,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(172,245,235,0.16)'
  }
});

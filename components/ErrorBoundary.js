import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GymVault ErrorBoundary Caught]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle color="#D4F53C" size={32} />
            </View>

            <Text style={styles.title}>Terjadi Kesalahan Aplikasi</Text>
            <Text style={styles.subtitle}>
              Sesi Anda aman. Database lokal dan antrian offline GymVault tidak terpengaruh.
            </Text>

            {this.state.error && (
              <ScrollView style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReload}
              accessibilityRole="button"
              accessibilityLabel="Muat Ulang Aplikasi"
              activeOpacity={0.8}
            >
              <RefreshCw color="#000000" size={18} />
              <Text style={styles.buttonText}>Muat Ulang Aplikasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252528',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 245, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 245, 60, 0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#909096',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    width: '100%',
    maxHeight: 100,
    backgroundColor: '#0A0A0C',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E22',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4F53C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

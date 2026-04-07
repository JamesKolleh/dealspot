import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState<string | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    requestPermission();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setScanData(data);
    let parsed: any = null;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      Alert.alert('Scanned', data);
      return;
    }

    const code = parsed.code || parsed.redemptionCode || 'Unknown';
    const deal = parsed.deal || parsed.dealTitle || 'Unknown deal';

    Alert.alert('Coupon scanned', `Deal: ${deal}\nCode: ${code}`, [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera. Please allow camera access to scan coupons.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan customer QR code</Text>
      <View style={styles.scannerBox}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Done</Text>
      </TouchableOpacity>
      {scanData ? <Text style={styles.scanResult}>Last scan: {scanData}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  scannerBox: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  button: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0A84FF',
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
  },
  closeText: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  scanResult: {
    marginTop: 16,
    color: '#333',
  },
});

export default ScannerScreen;

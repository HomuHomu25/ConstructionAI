import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const HistoryScreen = ({ route }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing reports once
  useEffect(() => {
    if (user) {
      console.log('Fetching reports for user:', user?.displayName || user?.email);
      setLoading(true);
      
      firestore()
        .collection('reports')
        .where('userId', '==', user?.displayName || user?.email || '')
        .get()
        .then(snapshot => {
          console.log('Fetched reports:', snapshot.size, 'documents');
          const reportData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Sort reports by timestamp descending (newest first)
          reportData.sort((a, b) => b.timestamp - a.timestamp);
          console.log('Processed reports:', reportData);
          setReports(reportData);
        })
        .catch(error => {
          console.error('Firestore error:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user]);

  // Handle new reports coming from navigation
  useEffect(() => {
    if (route.params?.newReport) {
      console.log('New report received:', route.params.newReport);
      // Add the new report to the beginning of the list
      setReports(prevReports => [route.params.newReport, ...prevReports]);
      // Clear the navigation params
      route.params.newReport = undefined;
    }
  }, [route.params?.newReport]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    
    // If timestamp is a Firestore timestamp, convert it to Date
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    
    try {
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = date.getDate();
      const year = date.getFullYear();
      const time = date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const timeZone = 'UTC+8'; // Since your timestamps are in UTC+8

      return `${month} ${day}, ${year} at ${time} ${timeZone}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(timestamp);
    }
  };

  const ReportItem = ({ report }) => (
    <View
      style={[
        styles.reportItem,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.reportContent}>
        <View style={styles.reportMainInfo}>
          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Title:</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {report.title || 'Untitled Report'}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Date:</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatDate(report.timestamp)}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Site:</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {report.site || 'Not specified'}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Location:</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {report.siteLocation || 'Not specified'}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Weather:</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {report.weather || 'Not specified'}
            </Text>
          </View>

          {report.description && (
            <View style={styles.infoSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Description:</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {report.description}
              </Text>
            </View>
          )}
        </View>

        {report.imageUrl && (
          <Image
            source={{ uri: report.imageUrl }}
            style={styles.reportThumbnail}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={[
      styles.emptyState,
      {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
      }
    ]}>
      <Text style={styles.emoji}>📋</Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
        No reports uploaded yet
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>
        Reports you upload will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
        Report Submission History
      </Text>
      <FlatList
        data={reports}
        renderItem={({ item }) => <ReportItem report={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportMainInfo: {
    flex: 1,
    marginRight: 12,
    maxWidth: '65%',
  },
  infoSection: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportThumbnail: {
    width: 200,
    height: 200,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    margin: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  emoji: {
    fontSize: 20,
  },
});

export default HistoryScreen; 
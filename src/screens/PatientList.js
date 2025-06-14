/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import {
    getpatientList,
    getalldoctors,
    getStoredUserDetails,
    getdefaultconsultant,
} from '../api/api';
import { TextInput } from 'react-native-paper';
import DateTimePicker from 'react-native-date-picker';
import PatientForm from './Patients';

import { useFocusEffect, useRoute } from '@react-navigation/native';

const iconMap = {
    Details: 'person-outline',
    Report: 'document-text-outline',
    History: 'time-outline',
    Prescriptions: 'medkit-outline',
    Vitals: 'fitness-outline',
};

export default function PatientList() {
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const navigation = useNavigation();


    const route = useRoute();
    useFocusEffect(
        React.useCallback(() => {
            fetchPatients(0, false); // Re-fetch when screen regains focus
        }, [])
    );



    const fetchDefaultDoctor = async () => {
        try {
            const res = await getStoredUserDetails();
            const defaultres = {
                consultantCode: res.userLinkedConsultantCode,
                consultantName: res.userLinkedConsultantName,
                consultantInitial: 'Dr.',
            };
            setSelectedDoctor(defaultres);
        } catch (err) {
            console.error('Error fetching default doctor:', err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await getdefaultconsultant();
            if (res.status && res.data) {
                setDoctors(res.data);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const formatDate = (inputDate) => {
        const dateObj = new Date(inputDate);
        return `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
    };

    const fetchPatients = async (pageIndex = 0, append = false) => {
        if (!selectedDoctor) return;
        try {
            setLoading(true);
            const res = await getpatientList(
                selectedDoctor.consultantCode,
                formatDate(selectedDate),
                searchText,
                '10',
                (pageIndex * 10).toString()
            );

            if (res.status && res.data) {
                if (res.data.length < 10) setHasMoreData(false);
                setPatients(prev => append ? [...prev, ...res.data] : res.data);
            } else {
                setHasMoreData(false);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDefaultDoctor();
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            setPage(0);
            setHasMoreData(true);
            fetchPatients(0, false);
        }
    }, [selectedDoctor, selectedDate, searchText]);

    const handleLoadMore = () => {
        if (!loading && hasMoreData) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPatients(nextPage, true);
        }
    };

    const toggleExpand = id => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleNavigate = (patientId, tab) => {
        navigation.navigate('PatientTabs', { patientId, initialTab: tab });
    };

    const renderPatientItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleNavigate(item.regId, 0)}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.patientName}</Text>
                        <Text style={styles.metaText}>
                            UHIDNO: {item.uhidNo} | Reg Date: {item.regDate}
                        </Text>
                        <Text style={styles.metaText}>
                            Reg No: {item.regNo}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleExpand(item.regId)}>
                        <Icon
                            name="chevron-forward-circle-outline"
                            size={24}
                            color="#333"
                            style={{ transform: [{ rotate: expandedId === item.regId ? '90deg' : '0deg' }] }}
                        />
                    </TouchableOpacity>
                </View>
                {expandedId === item.regId && (
                    <View style={styles.bottomTabs}>
                        {Object.keys(iconMap).map((label, i) => (
                            <TouchableOpacity
                                key={label}
                                style={styles.tabButton}
                                onPress={() => handleNavigate(item.regId, i)}
                            >
                                <Icon name={iconMap[label]} size={20} color="#333" />
                                <Text style={styles.tabText}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.doctorName}>
                    {selectedDoctor ? `${selectedDoctor.consultantName}` : 'Loading...'}
                </Text>
            </TouchableOpacity>

            {/* Search and Date Picker */}
            <View style={styles.searchRow}>
                <TextInput
                    mode="outlined"
                    placeholder="Search Patients"
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchInput}
                />
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                >
                    <Text>{selectedDate}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Patient Registration')}
                    style={styles.addButton}
                >
                    <Icon name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
            z
            <DateTimePicker
                modal
                open={showDatePicker}
                date={new Date(selectedDate)}
                mode="date"
                onConfirm={(date) => {
                    setSelectedDate(date.toISOString().split('T')[0]);
                    setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
            />

            {/* Doctor Selection Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {doctors.map(doc => (
                            <Pressable
                                key={doc.consultantCode}
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedDoctor(doc);
                                    setModalVisible(false);
                                    setExpandedId(null);
                                }}
                            >
                                <Text style={styles.modalText}>
                                    {`${doc.consultantInitial} ${doc.consultantName}`}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Patient List */}
            <FlatList
                data={patients}
                keyExtractor={(item) => item.regId.toString()}
                renderItem={renderPatientItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No patients found.</Text>
                }
                ListFooterComponent={
                    loading ? (
                        <ActivityIndicator style={{ marginVertical: 16 }} />
                    ) : !hasMoreData && patients.length > 0 ? (
                        <Text style={styles.footerText}>No more records.</Text>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        color: '#2563EB',
        backgroundColor: '#F3F4F9',
        paddingVertical: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    searchInput: {
        flex: 1.2,
        marginRight: 8,
        backgroundColor: '#fff',
        height: 40,
    },
    dateButton: {
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginRight: 8,
    },
    addButton: {
        padding: 10,
        backgroundColor: '#2563EB',
        borderRadius: 8,
    },
    card: {
        marginHorizontal: 16,
        padding: 12,
        backgroundColor: '#E0E7FF',
        marginBottom: 14,
        borderRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    metaText: {
        fontSize: 12,
        color: '#555',
    },
    bottomTabs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 14,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginTop: 12,
    },
    tabButton: {
        alignItems: 'center',
        marginVertical: 8,
    },
    tabText: {
        fontSize: 13,
        color: '#374151',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        elevation: 8,
    },
    modalItem: {
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomColor: '#E5E7EB',
        borderBottomWidth: 1,
    },
    modalText: {
        fontSize: 17,
        fontWeight: '500',
        color: '#111827',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    footerText: {
        textAlign: 'center',
        marginVertical: 16,
        color: '#888',
    },
});
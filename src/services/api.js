import { supabase } from '../lib/supabase';

// Helper to handle API responses
const handleResponse = (data, error) => {
    if (error) {
        console.error('API Error:', error);
        return { success: false, message: error.message };
    }
    return { success: true, data };
};

export const api = {
    auth: {
        getSession: async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                return { data, error };
            } catch (err) {
                return { data: null, error: err };
            }
        },
        login: async ({ email, password }) => {
            try {
                let loginEmail = email;

                // Check if input is email or username
                if (!email.includes('@')) {
                    // It's a username, get email from profile
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('username', email)
                        .single();

                    if (profileError || !profile) {
                        return { success: false, message: 'User not found' };
                    }
                    loginEmail = profile.email;
                }

                // Sign in with email and password
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password
                });

                if (error) return { success: false, message: error.message };

                // Get full profile details
                const { data: fullProfile, error: fullProfileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (fullProfileError) return { success: false, message: 'Failed to fetch profile' };

                return { success: true, user: fullProfile };
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        logout: async () => {
            const { error } = await supabase.auth.signOut();
            return handleResponse(null, error);
        },
        changePassword: async ({ oldPassword, newPassword }) => {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            return handleResponse(null, error);
        },
        requestPasswordChangeOTP: async ({ username }) => {
            // Supabase handles password reset via email
            const { data, error } = await supabase.auth.resetPasswordForEmail(username);
            return handleResponse(data, error);
        },
        changeUsername: async ({ currentPassword, newUsername }) => {
            // Changing username (email) requires re-authentication or specific flow
            // For now, let's assume username is just a profile field update
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const { error } = await supabase
                .from('profiles')
                .update({ username: newUsername })
                .eq('id', user.id);

            return handleResponse(null, error);
        },
        signUp: async ({ email, password, username, fullName }) => {
            try {
                console.log('Starting signup process for:', email);
                
                // Skip username check for now and let the database handle uniqueness
                // 2. Sign up with Supabase Auth
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username,
                            full_name: fullName,
                            role: 'admin'
                        }
                    }
                });

                if (error) {
                    console.error('Supabase auth error:', error);
                    if (error.message.includes('Failed to fetch')) {
                        return { 
                            success: false, 
                            message: 'Unable to connect to the authentication service. Please check your connection and try again.' 
                        };
                    }
                    // Handle specific auth errors
                    if (error.message.includes('already registered')) {
                        return { success: false, message: 'This email is already registered. Please try logging in instead.' };
                    }
                    return { success: false, message: error.message };
                }

                if (!data.user) {
                    return { success: false, message: 'Failed to create user account' };
                }

                return { 
                    success: true, 
                    user: data.user,
                    message: 'Account created successfully! Please check your email to verify your account.'
                };
            } catch (err) {
                console.error('API signUp error:', err);
                if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
                    return { 
                        success: false, 
                        message: 'Connection error. Please check your internet connection and try again.' 
                    };
                }
                return { success: false, message: err.message };
            }
        },
    },
    profiles: {
        get: async (userId) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (error) return { success: false, message: error.message };
                return { success: true, data };
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
    },
    member: {
        list: async (filters = {}) => {
            let query = supabase.from('members').select('*');

            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;
            
            if (error) return handleResponse(null, error);
            
            // Fetch plan names separately if needed
            if (data && data.length > 0) {
                const planIds = [...new Set(data.map(m => m.plan_id).filter(Boolean))];
                if (planIds.length > 0) {
                    const { data: plans } = await supabase
                        .from('membership_plans')
                        .select('id, name')
                        .in('id', planIds);
                    
                    if (plans) {
                        const planMap = Object.fromEntries(plans.map(p => [p.id, p]));
                        data.forEach(member => {
                            if (member.plan_id && planMap[member.plan_id]) {
                                member.membership_plans = planMap[member.plan_id];
                            }
                        });
                    }
                }
            }
            
            return handleResponse(data, error);
        },
        add: async (memberData) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            // Transform camelCase to snake_case for database columns
            const { planId, birthDate, idNumber, idDocumentType, seatNo, joinDate, endDate, ...rest } = memberData;
            
            // Clean up seat number - trim and convert empty to null
            const cleanSeatNo = seatNo && String(seatNo).trim() !== '' ? String(seatNo).trim() : null;
            
            const dbData = { 
                ...rest, 
                plan_id: planId || null, // Convert empty string to null
                birth_date: birthDate || null,
                id_number: idNumber || null,
                id_document_type: idDocumentType || null,
                seat_no: cleanSeatNo,
                join_date: joinDate,
                end_date: endDate,
                user_id: user.id // Add user_id for isolation
            };

            const { data, error } = await supabase
                .from('members')
                .insert([dbData])
                .select()
                .single();
            return handleResponse(data, error);
        },
        update: async (memberData) => {
            // Transform camelCase to snake_case for database columns
            const { id, planId, birthDate, idNumber, idDocumentType, seatNo, joinDate, endDate, ...rest } = memberData;
            
            // Clean up seat number - trim and convert empty to null
            const cleanSeatNo = seatNo && String(seatNo).trim() !== '' ? String(seatNo).trim() : null;
            
            const dbData = { 
                ...rest, 
                plan_id: planId || null, // Convert empty string to null
                birth_date: birthDate || null,
                id_number: idNumber || null,
                id_document_type: idDocumentType || null,
                seat_no: cleanSeatNo,
                join_date: joinDate,
                end_date: endDate
            };

            const { data, error } = await supabase
                .from('members')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();
            return handleResponse(data, error);
        },
        delete: async (id) => {
            // Soft delete or status update
            // Logic: toggle suspend/activate
            // First get current status
            const { data: member } = await supabase.from('members').select('status').eq('id', id).single();
            const newStatus = member.status === 'suspended' ? 'active' : 'suspended';

            const { data, error } = await supabase
                .from('members')
                .update({ status: newStatus })
                .eq('id', id)
                .select()
                .single();
            return handleResponse(data, error);
        },
        permanentDelete: async (id) => {
            try {
                // With optimized schema:
                // - Attendance records will CASCADE delete (they're dependent on member)
                // - Payment records will have member_id SET to NULL (preserve for accounting)
                // - Biometric data should CASCADE delete (if table exists)
                
                // Only manually delete biometric data if the table exists
                // (attendance and payments are handled by database constraints)
                try {
                    await supabase.from('biometric_data').delete().eq('member_id', id);
                } catch (bioError) {
                    // Biometric table might not exist, ignore error
                    console.log('Biometric data table not found or already deleted');
                }
                
                // Delete the member - database constraints will handle the rest
                const { error } = await supabase.from('members').delete().eq('id', id);
                
                if (error) {
                    return handleResponse(null, error);
                }
                
                return { 
                    success: true, 
                    message: 'Member deleted. Payment history preserved for accounting.' 
                };
            } catch (err) {
                console.error('Error in permanentDelete:', err);
                return { success: false, message: err.message };
            }
        },
        getNextSeatNumber: async () => {
            try {
                // 1. Get current user for proper isolation
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // 2. Get total seats from settings
                const { data: settingData, error: settingError } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'total_seats')
                    .single();

                const totalSeats = settingData?.value ? parseInt(settingData.value) : 50;

                // 3. Get all occupied seat numbers (active members only, current user)
                const { data: members, error: membersError } = await supabase
                    .from('members')
                    .select('seat_no')
                    .eq('status', 'active')
                    .eq('user_id', user.id)
                    .not('seat_no', 'is', null);

                if (membersError) return { success: false, message: membersError.message };

                // 4. Find first available seat number
                const occupiedSeats = members
                    .map(m => parseInt(m.seat_no))
                    .filter(n => !isNaN(n))
                    .sort((a, b) => a - b);

                let nextSeat = 1;
                for (const seat of occupiedSeats) {
                    if (seat === nextSeat) {
                        nextSeat++;
                    } else if (seat > nextSeat) {
                        break;
                    }
                }

                // 5. Check if next seat exceeds total seats
                if (nextSeat > totalSeats) {
                    return { 
                        success: false, 
                        message: `All ${totalSeats} seats are occupied. Please increase total seats in settings.` 
                    };
                }

                return { success: true, data: nextSeat.toString() };
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        getSeatStats: async () => {
            try {
                // 1. Get current user for proper isolation
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // 2. Get total seats from settings
                const { data: settingData } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'total_seats')
                    .single();

                const totalSeats = settingData?.value ? parseInt(settingData.value) : 50;

                // 3. Count occupied seats (active members with seat numbers, current user)
                const { count: occupiedSeats } = await supabase
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')
                    .eq('user_id', user.id)
                    .not('seat_no', 'is', null)
                    .neq('seat_no', '');

                const occupied = occupiedSeats || 0;
                const available = Math.max(0, totalSeats - occupied);
                const utilizationPercentage = totalSeats > 0 ? Math.round((occupied / totalSeats) * 100) : 0;

                return {
                    success: true,
                    data: {
                        totalSeats,
                        occupiedSeats: occupied,
                        availableSeats: available,
                        utilizationPercentage
                    }
                };
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        validateSeatNumber: async ({ seatNo, memberId = null }) => {
            try {
                // Clean and validate input
                const cleanSeatNo = seatNo ? seatNo.toString().trim() : '';
                
                if (!cleanSeatNo || cleanSeatNo === '') {
                    return { success: true, available: true, message: null };
                }
                
                const seatNumber = parseInt(cleanSeatNo);
                
                if (isNaN(seatNumber)) {
                    return { 
                        success: true, 
                        available: false,
                        message: 'Seat number must be a valid number'
                    };
                }
                
                // 1. Get total seats from settings
                const { data: settingData } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'total_seats')
                    .single();

                const totalSeats = settingData?.value ? parseInt(settingData.value) : 50;

                // 2. Check if seat number exceeds total seats
                if (seatNumber > totalSeats) {
                    return { 
                        success: true, 
                        available: false,
                        message: `Seat number cannot exceed total seats (${totalSeats})`
                    };
                }

                // 3. Get current user for proper isolation
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    return { success: false, message: 'Not authenticated' };
                }

                // 4. Check if seat is already taken by an active member (with user isolation)
                let query = supabase
                    .from('members')
                    .select('id, status, seat_no, user_id')
                    .eq('seat_no', cleanSeatNo)
                    .eq('status', 'active')
                    .eq('user_id', user.id); // Ensure we only check current user's members

                // Exclude current member when editing
                if (memberId) {
                    query = query.neq('id', memberId);
                }

                const { data, error } = await query.maybeSingle();

                if (error) {
                    console.error('Seat validation error:', error);
                    return { success: false, message: error.message };
                }
                
                console.log('Seat validation result for seat', cleanSeatNo, ':', { found: !!data, data });
                
                return { 
                    success: true, 
                    available: !data,
                    message: data ? `Seat number ${cleanSeatNo} is already assigned to an active member` : null
                };
            } catch (err) {
                console.error('Seat validation exception:', err);
                return { success: false, message: err.message };
            }
        },
        renew: async (renewalData) => {
            try {
                const { memberId, planId, paymentDetails } = renewalData;

                // Get current user for proper isolation
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // 1. Get plan details
                const { data: plan, error: planError } = await supabase
                    .from('membership_plans')
                    .select('*')
                    .eq('id', planId)
                    .single();

                if (planError || !plan) {
                    return { success: false, message: 'Invalid plan selected' };
                }

                // 2. Calculate new dates
                const joinDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + plan.duration_days);

                // 3. Update member
                const { error: updateError } = await supabase
                    .from('members')
                    .update({
                        plan_id: planId,
                        join_date: joinDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0],
                        status: 'active'
                    })
                    .eq('id', memberId);

                if (updateError) {
                    console.error('Member update error:', updateError);
                    return { success: false, message: updateError.message };
                }

                // 4. Record payment with correct column names matching actual schema
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        member_id: memberId,
                        amount: plan.price,
                        payment_method: paymentDetails.mode || 'cash',
                        type: 'membership',
                        notes: paymentDetails.note || 'Membership renewal',
                        transaction_id: `TXN-${Date.now()}`,
                        user_id: user.id // Add user_id for RLS policy
                    });

                if (paymentError) {
                    console.error('Payment insert error:', paymentError);
                    return { success: false, message: `Membership updated but payment recording failed: ${paymentError.message}` };
                }

                return { success: true, message: 'Membership renewed successfully' };
            } catch (err) {
                console.error('Renewal error:', err);
                return { success: false, message: err.message };
            }
        }
    },
    dashboard: {
        stats: async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

                // Parallelize queries for better performance
                const [
                    { count: totalMembers },
                    { count: todayAttendance },
                    { data: todayPayments },
                    { data: todayExpenditures },
                    { data: monthlyPayments },
                    { data: monthlyExpenditures },
                    { count: expiringMembers }
                ] = await Promise.all([
                    supabase.from('members').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
                    supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('check_in', `${today}T00:00:00`),
                    supabase.from('payments').select('amount').gte('payment_date', `${today}T00:00:00`),
                    supabase.from('expenditures').select('amount').gte('date', today),
                    supabase.from('payments').select('amount').gte('payment_date', `${startOfMonth}T00:00:00`),
                    supabase.from('expenditures').select('amount').gte('date', startOfMonth),
                    supabase.from('members').select('*', { count: 'exact', head: true }).lt('end_date', new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()) // Expiring in 10 days
                ]);

                const todayIncome = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                const todayExpenditure = todayExpenditures?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                const monthlyIncome = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                const monthlyExpenditure = monthlyExpenditures?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

                return {
                    success: true,
                    data: {
                        totalMembers: totalMembers || 0,
                        todayAttendance: todayAttendance || 0,
                        todayIncome,
                        todayExpenditure,
                        todayNetIncome: todayIncome - todayExpenditure,
                        monthlyIncome,
                        monthlyExpenditure,
                        monthlyNetIncome: monthlyIncome - monthlyExpenditure,
                        expiringMembers: expiringMembers || 0
                    }
                };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }
    },
    attendance: {
        list: async (filters = {}) => {
            let query = supabase.from('attendance').select('*, members(name)');

            if (filters.memberId) query = query.eq('member_id', filters.memberId);
            if (filters.dateFrom) query = query.gte('check_in', `${filters.dateFrom}T00:00:00`);
            if (filters.dateTo) query = query.lte('check_in', `${filters.dateTo}T23:59:59`);
            if (filters.source) query = query.eq('source', filters.source);

            query = query.order('check_in', { ascending: false });

            const { data, error } = await query;

            if (data) {
                const flattened = data.map(record => ({
                    ...record,
                    member_name: record.members?.name || 'Unknown'
                }));
                return { success: true, data: flattened };
            }
            return handleResponse(data, error);
        },
        today: async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance')
                .select('*, members(name)')
                .gte('check_in', `${today}T00:00:00`)
                .order('check_in', { ascending: false });

            if (data) {
                // Map member name to flat structure if needed
                const flattened = data.map(record => ({
                    ...record,
                    member_name: record.members?.name || 'Unknown'
                }));
                return { success: true, data: flattened };
            }
            return handleResponse(data, error);
        },
        add: async ({ memberId, checkIn, checkOut, source = 'manual' } = {}) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                const dbData = {
                    member_id: memberId,
                    check_in: checkIn || new Date().toISOString(),
                    check_out: checkOut || null,
                    source,
                    user_id: user.id
                };

                const { data, error } = await supabase
                    .from('attendance')
                    .insert([dbData])
                    .select()
                    .single();

                return handleResponse(data, error);
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        checkin: async ({ memberId, source = 'manual' } = {}) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                const dbData = {
                    member_id: memberId,
                    check_in: new Date().toISOString(),
                    source,
                    user_id: user.id
                };

                const { data, error } = await supabase
                    .from('attendance')
                    .insert([dbData])
                    .select()
                    .single();

                return handleResponse(data, error);
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        checkout: async ({ memberId, autoCheckOut = false } = {}) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // Find the latest active attendance record for this member (no check_out)
                const { data: activeRecord, error: fetchError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('member_id', memberId)
                    .is('check_out', null)
                    .order('check_in', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fetchError) return { success: false, message: fetchError.message };
                if (!activeRecord) return { success: false, message: 'No active attendance found to check out' };

                const { data, error } = await supabase
                    .from('attendance')
                    .update({ check_out: new Date().toISOString() })
                    .eq('id', activeRecord.id)
                    .select()
                    .single();

                return handleResponse(data, error);
            } catch (err) {
                return { success: false, message: err.message };
            }
        },
        mark: async ({ memberId, status }) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            // Simple check-in/out logic
            // This is a simplified version. Real logic might need to check if already checked in.
            const { data, error } = await supabase
                .from('attendance')
                .insert([{ 
                    member_id: memberId, 
                    status, 
                    check_in: new Date().toISOString(), 
                    source: 'web',
                    user_id: user.id // Add user_id for isolation
                }])
                .select()
                .single();
            return handleResponse(data, error);
        }
    },
    payment: {
        list: async (filters = {}) => {
            let query = supabase.from('payments').select('*, members(name)');

            if (filters.memberId) query = query.eq('member_id', filters.memberId);
            if (filters.dateFrom) query = query.gte('payment_date', `${filters.dateFrom}T00:00:00`);
            if (filters.dateTo) query = query.lte('payment_date', `${filters.dateTo}T23:59:59`);
            if (filters.mode) query = query.eq('payment_method', filters.mode);
            if (filters.planId) query = query.eq('plan_id', filters.planId);

            // Search by member name (requires join filtering which is tricky in simple select, 
            // but we can filter on the client or use a more complex query if needed. 
            // For now, let's assume memberId is used for specific member search)

            query = query.order('payment_date', { ascending: false });

            const { data, error } = await query;

            if (data) {
                const flattened = data.map(p => ({
                    ...p,
                    member_name: p.members?.name,
                    paid_at: p.payment_date // Map payment_date back to paid_at for frontend compatibility
                }));
                return { success: true, data: flattened };
            }
            return handleResponse(data, error);
        },
        add: async (paymentData) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const { memberId, planId, ...rest } = paymentData;
            const dbData = {
                ...rest,
                member_id: memberId,
                payment_date: new Date().toISOString(),
                user_id: user.id // Add user_id for isolation
            };

            const { data, error } = await supabase
                .from('payments')
                .insert([dbData])
                .select()
                .single();
            return handleResponse(data, error);
        }
    },
    expenditure: {
        list: async (filters = {}) => {
            let query = supabase.from('expenditures').select('*');

            if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
            if (filters.dateTo) query = query.lte('date', filters.dateTo);
            if (filters.category) query = query.eq('category', filters.category);

            query = query.order('date', { ascending: false });

            const { data, error } = await query;
            return handleResponse(data, error);
        },
        add: async (data) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const dbData = {
                ...data,
                user_id: user.id // Add user_id for isolation
            };

            const { data: result, error } = await supabase
                .from('expenditures')
                .insert([dbData])
                .select()
                .single();
            return handleResponse(result, error);
        },
        update: async (data) => {
            const { id, ...rest } = data;
            const { data: result, error } = await supabase
                .from('expenditures')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
            return handleResponse(result, error);
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('expenditures')
                .delete()
                .eq('id', id);
            return handleResponse(null, error);
        },
        stats: async () => {
            // Simple stats if needed
            return { success: true, data: {} };
        }
    },
    report: {
        attendance: async ({ dateFrom, dateTo }) => {
            const { data, error } = await supabase
                .from('attendance')
                .select('*, members(name)')
                .gte('check_in', `${dateFrom}T00:00:00`)
                .lte('check_in', `${dateTo}T23:59:59`)
                .order('check_in', { ascending: false });

            if (data) {
                const flattened = data.map(record => ({
                    ...record,
                    member_name: record.members?.name || 'Unknown',
                    date: record.check_in
                }));
                return { success: true, data: flattened };
            }
            return handleResponse(data, error);
        },
        payments: async ({ dateFrom, dateTo }) => {
            const { data, error } = await supabase
                .from('payments')
                .select('*, members(name)')
                .gte('payment_date', `${dateFrom}T00:00:00`)
                .lte('payment_date', `${dateTo}T23:59:59`)
                .order('payment_date', { ascending: false });

            if (data) {
                const flattened = data.map(p => ({
                    ...p,
                    member_name: p.members?.name,
                    payment_method: p.payment_method
                }));
                return { success: true, data: flattened };
            }
            return handleResponse(data, error);
        },
        expenditures: async ({ dateFrom, dateTo }) => {
            const { data, error } = await supabase
                .from('expenditures')
                .select('*')
                .gte('date', dateFrom)
                .lte('date', dateTo)
                .order('date', { ascending: false });
            return handleResponse(data, error);
        },
        generateReceipt: async ({ paymentId }) => {
            // In web, we can't easily generate and save a file to disk like Electron.
            // We can return a success and let the frontend handle "downloading" or printing.
            return { success: true, message: 'Receipt generation ready', id: paymentId };
        },
        downloadReceipt: async ({ paymentId }) => {
            return { success: true, message: 'Receipt download ready', id: paymentId };
        },
        exportWithDialog: async ({ data, type, format }) => {
            // Web implementation: Trigger a browser download
            try {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_report_${new Date().toISOString()}.${format === 'csv' ? 'csv' : 'json'}`; // Simplified
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                return { success: true, filepath: 'Downloads folder' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        }
    },
    backup: {
        createBackup: async () => {
            // Web implementation: Download all data as JSON
            try {
                // Fetch all critical tables
                const [members, payments, attendance, expenditures, settings] = await Promise.all([
                    supabase.from('members').select('*'),
                    supabase.from('payments').select('*'),
                    supabase.from('attendance').select('*'),
                    supabase.from('expenditures').select('*'),
                    supabase.from('settings').select('*')
                ]);

                const backupData = {
                    timestamp: new Date().toISOString(),
                    members: members.data,
                    payments: payments.data,
                    attendance: attendance.data,
                    expenditures: expenditures.data,
                    settings: settings.data
                };

                const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `library_backup_${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                return { success: true, timestamp: new Date().toISOString() };
            } catch (e) {
                return { success: false, message: e.message };
            }
        }
    },
    file: {
        openPath: async (path) => {
            console.warn('File opening not supported in web version');
            return { success: false, message: 'Not supported in web version' };
        },
        showInFolder: async (path) => {
            console.warn('Show in folder not supported in web version');
            return { success: false, message: 'Not supported in web version' };
        }
    },
    notification: {
        sendWelcome: async (member) => {
            // Email notifications require a backend server
            // For now, this is a no-op. To enable:
            // 1. Set up a backend server (Express/Fastify)
            // 2. Configure nodemailer with SMTP settings
            // 3. Uncomment the implementation in api/notifications/welcome.js
            console.log('Welcome notification for:', member.name);
            return { success: true, message: 'Notification logged (email disabled)' };
        },
        sendExpiryReminders: async () => {
            return { success: true, data: [] }; // Mock for now
        }
    },
    plan: {
        list: async () => {
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .order('price', { ascending: true });
            return handleResponse(data, error);
        },
        add: async (planData) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const dbData = {
                ...planData,
                user_id: user.id // Add user_id for isolation
            };

            const { data, error } = await supabase
                .from('membership_plans')
                .insert([dbData])
                .select()
                .single();
            return handleResponse(data, error);
        },
        update: async (planData) => {
            const { id, ...rest } = planData;
            const { data, error } = await supabase
                .from('membership_plans')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
            return handleResponse(data, error);
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('membership_plans')
                .delete()
                .eq('id', id);
            return handleResponse(null, error);
        }
    },
    settings: {
        getSettings: async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('*');
            
            if (error) return handleResponse(null, error);
            
            // Convert array of key-value pairs to object
            const settings = {};
            data?.forEach(item => {
                settings[item.key] = item.value;
            });
            
            return { success: true, settings };
        },
        updateSettings: async (settingsData) => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // Update each setting key individually
                const updates = Object.entries(settingsData).map(([key, value]) => 
                    supabase
                        .from('settings')
                        .upsert({ key, value, user_id: user.id }, { onConflict: 'key,user_id' })
                );
                
                await Promise.all(updates);
                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }
    },

    // Add setup-related API functions
    checkSetupStatus: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'setup_completed')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking setup status:', error);
                return { success: false, setupCompleted: false };
            }

            return { 
                success: true, 
                setupCompleted: data && data.value === 'true' 
            };
        } catch (error) {
            console.error('Error in checkSetupStatus:', error);
            return { success: false, setupCompleted: false };
        }
    },

    markSetupCompleted: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const { error } = await supabase
                .from('settings')
                .upsert({ 
                    key: 'setup_completed', 
                    value: 'true', 
                    user_id: user.id 
                }, { onConflict: 'key,user_id' });

            if (error) {
                console.error('Error marking setup as completed:', error);
                return { success: false, message: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Error in markSetupCompleted:', error);
            return { success: false, message: error.message };
        }
    },

    saveSettings: async (settingsData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            // Flatten settings object for storage
            const flattenedSettings = {};
            
            // Handle nested settings structure
            Object.entries(settingsData).forEach(([section, sectionData]) => {
                Object.entries(sectionData).forEach(([key, value]) => {
                    // Special handling for nested objects like operatingHours
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        flattenedSettings[`${section}_${key}`] = JSON.stringify(value);
                    } else {
                        flattenedSettings[`${section}_${key}`] = String(value);
                    }
                });
            });

            // Update each setting key individually
            const updates = Object.entries(flattenedSettings).map(([key, value]) => 
                supabase
                    .from('settings')
                    .upsert({ key, value, user_id: user.id }, { onConflict: 'key,user_id' })
            );
            
            await Promise.all(updates);
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { success: false, message: error.message };
        }
    },

    settings: {
        getSettings: async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('*');
            
            if (error) return handleResponse(null, error);
            
            // Convert array of key-value pairs to object
            const settings = {};
            data?.forEach(item => {
                settings[item.key] = item.value;
            });
            
            return { success: true, settings };
        },
        updateSettings: async (settingsData) => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, message: 'Not authenticated' };

                // Update each setting key individually
                const updates = Object.entries(settingsData).map(([key, value]) => 
                    supabase
                        .from('settings')
                        .upsert({ key, value, user_id: user.id }, { onConflict: 'key,user_id' })
                );
                
                await Promise.all(updates);
                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }
    },
    biometric: {
        testConnection: async () => {
            return { success: false, message: 'Biometric not supported in web version' };
        },
        getStatus: async () => {
            return { success: false, message: 'Biometric not supported in web version' };
        },
        startScanning: async () => {
            return { success: false, message: 'Biometric not supported in web version' };
        },
        stopScanning: async () => {
            return { success: true };
        },
        enrollFingerprint: async (memberId) => {
            return { success: false, error: 'Biometric enrollment not supported in web version' };
        },
        deleteFingerprint: async (memberId) => {
            return { success: true }; // Pretend to delete
        },
        onEvent: (callback) => {
            // No-op for web
            return () => { };
        },
        onAttendanceRecorded: (callback) => {
            // No-op for web
            return () => { };
        }
    }
};

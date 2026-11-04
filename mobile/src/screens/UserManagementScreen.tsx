import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AuthUser } from '../services/authService';


import {
  createUser,
  getUsers,
  updateUser,
  type ManagedUser,
  type UserFormData,
} from '../services/userService';
import { getBranches } from '../services/branchService';
import type { Branch } from '../services/branchService';

interface UserManagementScreenProps {
  user: AuthUser;
  onBack: () => void;
}

export default function UserManagementScreen({
  user,
  onBack,
}: UserManagementScreenProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const userRole = user.role?.name;

  const isOwner = userRole === 'Owner';

  const isAdmin = userRole === 'Admin';

  const isGlobalAdmin = isAdmin && user.is_global_admin === true;

  const isBranchAdmin = isAdmin && !isGlobalAdmin;

  const canCreateUser = isOwner || isAdmin;

  const [branches, setBranches] = useState<Branch[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    password: '',
    role_id: '',
    branch_id: '',
    is_active: true,
    is_global_admin: false,
  });

  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    username: '',
    email: '',
    password: '',
    role_id: '4',
    branch_id: '',
    is_active: true,
    is_global_admin: false,
  });

  const loadBranches = async () => {
    try {
      const result = await getBranches();
      setBranches(result);
    } catch (error) {
      console.error('Unable to load branches:', error);
    }
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getUsers();
      setUsers(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load users.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    loadBranches();
  }, [loadUsers]);

  const handleCreateUser = async () => {
    setFormError('');

    // Basic required-field validation
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    // Owner and Global Admin must select a branch
    // unless the Owner is creating a Global Admin.
    const isCreatingGlobalAdmin =
      isOwner &&
      form.role_id === '2' &&
      form.is_global_admin;

    if (
      (isOwner || isGlobalAdmin) &&
      !isCreatingGlobalAdmin &&
      !form.branch_id
    ) {
      setFormError('Please select a branch.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: UserFormData = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        suffix: form.suffix.trim() || null,
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role_id: Number(form.role_id),
        branch_id: isCreatingGlobalAdmin
          ? null
          : form.branch_id
            ? Number(form.branch_id)
            : null,
        is_global_admin: isCreatingGlobalAdmin,
        is_active: form.is_active,
      };

      await createUser(payload);

      setShowCreateModal(false);
      await loadUsers();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to create user.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (
      !editForm.first_name.trim() ||
      !editForm.last_name.trim() ||
      !editForm.email.trim()
    ) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (
      editForm.password.trim() !== '' &&
      editForm.password.length < 8
    ) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    if (!editForm.role_id) {
      setFormError('Please select a role.');
      return;
    }

    if (!editForm.is_global_admin && !editForm.branch_id) {
      setFormError('Please select a branch.');
      return;
    }

    const payload: Partial<UserFormData> = {
      first_name: editForm.first_name.trim(),
      middle_name: editForm.middle_name.trim() || null,
      last_name: editForm.last_name.trim(),
      suffix: editForm.suffix.trim() || null,
      email: editForm.email.trim(),
      role_id: Number(editForm.role_id),
      branch_id: editForm.is_global_admin
        ? null
        : Number(editForm.branch_id),
      is_global_admin: editForm.is_global_admin,
      is_active: editForm.is_active,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    try {
      setIsSaving(true);
      setFormError('');

      await updateUser(editingUser.id, payload);

      setShowEditModal(false);
      setEditingUser(null);

      await loadUsers();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update user.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (managedUser: ManagedUser) => {
    setEditingUser(managedUser);

    setEditForm({
      first_name: managedUser.first_name ?? '',
      middle_name: managedUser.middle_name ?? '',
      last_name: managedUser.last_name ?? '',
      suffix: managedUser.suffix ?? '',
      email: managedUser.email ?? '',
      password: '',
      role_id: String(managedUser.role_id),
      branch_id: managedUser.branch_id
        ? String(managedUser.branch_id)
        : '',
      is_active: managedUser.is_active,
      is_global_admin: managedUser.is_global_admin,
    });

    setFormError('');
    setShowEditModal(true);
  };

  const handleRoleChange = (roleId: string) => {
    setForm((previous) => ({
      ...previous,
      role_id: roleId,
      branch_id: '',
      is_global_admin: false,
    }));
  };

  const canEditManagedUser = (managedUser: ManagedUser): boolean => {
    const targetRole = managedUser.role?.name;

    // Owner can manage user accounts.
    if (isOwner) {
      return true;
    }

    // Global Admin can manage branch-level Admin,
    // Accounting, and Staff accounts.
    if (isGlobalAdmin) {
      return (
        (targetRole === 'Admin' && !managedUser.is_global_admin) ||
        targetRole === 'Accounting' ||
        targetRole === 'Staff'
      );
    }

    // Branch Admin can edit their own account
    // and Accounting/Staff users in their branch.
    if (isBranchAdmin) {
      if (managedUser.id === user.id) {
        return true;
      }

      return (
        (targetRole === 'Accounting' || targetRole === 'Staff') &&
        managedUser.branch_id === user.branch?.id
      );
    }

    return false;
  };

  const isEditingOwnAccount = editingUser?.id === user.id;

  const isProtectedSelfEdit =
    isEditingOwnAccount && (isOwner || isGlobalAdmin);

  const canEditRoleAndBranch =
    !isEditingOwnAccount && (isOwner || isGlobalAdmin || isBranchAdmin);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          Manage system users and their access.
        </Text>

        {canCreateUser && (
          <TouchableOpacity
            style={styles.createButton}
           onPress={() => {
            setFormError('');
            setForm({
              first_name: '',
              middle_name: '',
              last_name: '',
              suffix: '',
              username: '',
              email: '',
              password: '',
              role_id: '4',
              branch_id: '',
              is_active: true,
              is_global_admin: false,
            });

            if (isOwner || isGlobalAdmin) {
              loadBranches();
            }

            setShowCreateModal(true);
          }}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>+ Create User</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Users</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void loadUsers()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void loadUsers()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length > 0 ? (
        <View style={styles.userList}>
          {users.map((managedUser) => {
            const fullName = [
              managedUser.first_name,
              managedUser.middle_name,
              managedUser.last_name,
              managedUser.suffix,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <View key={managedUser.id} style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {fullName || managedUser.username}
                    </Text>

                    <Text style={styles.username}>
                      @{managedUser.username}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      managedUser.is_active
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        managedUser.is_active
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {managedUser.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>

                  {canEditManagedUser(managedUser) && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleOpenEditModal(managedUser)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editButtonText}>
                      Edit User
                    </Text>
                  </TouchableOpacity>
                )}
                </View>

                <View style={styles.userDetails}>
                  <Text style={styles.detailText}>
                    Role: {managedUser.role?.name ?? 'No role'}
                  </Text>

                                  <Text style={styles.detailText}>
                    Branch: {managedUser.branch?.name ?? 'No branch'}
                  </Text>

                  <Text style={styles.detailText}>
                    Email: {managedUser.email}
                  </Text>

                  {managedUser.is_global_admin && (
                    <Text style={styles.globalAdminText}>
                      Global Admin
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptyText}>
            There are no users available to display.
          </Text>
        </View>
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Create User</Text>
              <Text style={styles.modalSubtitle}>
                Enter the user's personal and account information.
              </Text>

              {formError ? (
                <View style={styles.formErrorCard}>
                  <Text style={styles.formErrorText}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formSectionTitle}>
                Personal Information
              </Text>

              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                value={form.first_name}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    first_name: value,
                  }))
                }
                placeholder="First name"
              />

              <Text style={styles.inputLabel}>Middle Name</Text>
              <TextInput
                style={styles.textInput}
                value={form.middle_name}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    middle_name: value,
                  }))
                }
                placeholder="Middle name"
              />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                value={form.last_name}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    last_name: value,
                  }))
                }
                placeholder="Last name"
              />

              <Text style={styles.inputLabel}>Suffix</Text>
              <TextInput
                style={styles.textInput}
                value={form.suffix}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    suffix: value,
                  }))
                }
                placeholder="e.g. Jr., Sr."
              />

              <Text style={styles.formSectionTitle}>
                Account Information
              </Text>

              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.textInput}
                value={form.username}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    username: value,
                  }))
                }
                placeholder="Username"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={form.email}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    email: value,
                  }))
                }
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.textInput}
                value={form.password}
                onChangeText={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    password: value,
                  }))
                }
                placeholder="Minimum 8 characters"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Role *</Text>

              {(isOwner || isGlobalAdmin
                ? [
                    { id: '2', name: 'Admin' },
                    { id: '3', name: 'Accounting' },
                    { id: '4', name: 'Staff' },
                  ]
                : [
                    { id: '3', name: 'Accounting' },
                    { id: '4', name: 'Staff' },
                  ]
              ).map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={styles.optionRow}
                  onPress={() => handleRoleChange(role.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioOuter}>
                    {form.role_id === role.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>

                  <Text style={styles.optionText}>
                    {role.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {(isOwner || isGlobalAdmin) && (
                <>
                  {isOwner && form.role_id === '2' && (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() =>
                        setForm((previous) => ({
                          ...previous,
                          is_global_admin: !previous.is_global_admin,
                          branch_id: '',
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.checkbox}>
                        {form.is_global_admin && (
                          <Text style={styles.checkboxCheck}>✓</Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionText}>
                          Grant Global Admin access
                        </Text>
                        <Text style={styles.optionDescription}>
                          Global Admin access is only available to Owners.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {!form.is_global_admin && (
                    <>
                      <Text style={styles.inputLabel}>
                        Branch *
                      </Text>

                      {branches.map((branch) => (
                        <TouchableOpacity
                          key={branch.id}
                          style={styles.optionRow}
                          onPress={() =>
                            setForm((previous) => ({
                              ...previous,
                              branch_id: String(branch.id),
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <View style={styles.radioOuter}>
                            {form.branch_id === String(branch.id) && (
                              <View style={styles.radioInner} />
                            )}
                          </View>

                          <Text style={styles.optionText}>
                            {branch.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </>
              )}

              <Text style={styles.formSectionTitle}>
                Account Status
              </Text>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() =>
                  setForm((previous) => ({
                    ...previous,
                    is_active: !previous.is_active,
                  }))
                }
                activeOpacity={0.8}
              >
                <View style={styles.checkbox}>
                  {form.is_active && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>

                <Text style={styles.optionText}>
                  Active account
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => void handleCreateUser()}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      Create User
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


                  {/** edit modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isSaving) setShowEditModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Edit User</Text>
              <Text style={styles.modalSubtitle}>
                Update the user's personal and account information.
              </Text>

              {formError ? (
                <View style={styles.formErrorCard}>
                  <Text style={styles.formErrorText}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formSectionTitle}>
                Personal Information
              </Text>

              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.first_name}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    first_name: value,
                  }))
                }
                placeholder="First name"
              />

              <Text style={styles.inputLabel}>Middle Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.middle_name}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    middle_name: value,
                  }))
                }
                placeholder="Middle name"
              />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.last_name}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    last_name: value,
                  }))
                }
                placeholder="Last name"
              />

              <Text style={styles.inputLabel}>Suffix</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.suffix}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    suffix: value,
                  }))
                }
                placeholder="e.g. Jr., Sr."
              />

              <Text style={styles.formSectionTitle}>
                Account Information
              </Text>

              {editingUser && (
                <>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={[styles.textInput, { opacity: 0.6 }]}
                    value={editingUser.username}
                    editable={false}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.email}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    email: value,
                  }))
                }
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.password}
                onChangeText={(value) =>
                  setEditForm((previous) => ({
                    ...previous,
                    password: value,
                  }))
                }
                placeholder="Leave blank to keep current password"
                secureTextEntry
              />

              {canEditRoleAndBranch && (
                <>
                  <Text style={styles.formSectionTitle}>
                    Role and Branch
                  </Text>

                  <Text style={styles.inputLabel}>Role *</Text>

                  {(isOwner || isGlobalAdmin
                    ? [
                        { id: '2', name: 'Admin' },
                        { id: '3', name: 'Accounting' },
                        { id: '4', name: 'Staff' },
                      ]
                    : [
                        { id: '3', name: 'Accounting' },
                        { id: '4', name: 'Staff' },
                      ]
                  ).map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={styles.optionRow}
                      onPress={() =>
                        setEditForm((previous) => ({
                          ...previous,
                          role_id: role.id,
                          is_global_admin:
                            role.id === '2'
                              ? previous.is_global_admin
                              : false,
                          branch_id:
                            role.id === '2' && previous.is_global_admin
                              ? ''
                              : previous.branch_id,
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.radioOuter}>
                        {editForm.role_id === role.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>

                      <Text style={styles.optionText}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {isOwner && editForm.role_id === '2' && (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() =>
                        setEditForm((previous) => ({
                          ...previous,
                          is_global_admin: !previous.is_global_admin,
                          branch_id: '',
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.checkbox}>
                        {editForm.is_global_admin && (
                          <Text style={styles.checkboxCheck}>✓</Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionText}>
                          Grant Global Admin access
                        </Text>
                        <Text style={styles.optionDescription}>
                          Only the Owner can grant Global Admin access.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {!editForm.is_global_admin && (
                    <>
                      <Text style={styles.inputLabel}>Branch *</Text>

                      {isBranchAdmin && (
                        <Text style={styles.optionDescription}>
                          This user will remain assigned to your branch.
                        </Text>
                      )}

                      {(isBranchAdmin
                        ? branches.filter(
                            (branch) => branch.id === user.branch?.id
                          )
                        : branches
                      ).map((branch) => (
                        <TouchableOpacity
                          key={branch.id}
                          style={styles.optionRow}
                          onPress={() =>
                            setEditForm((previous) => ({
                              ...previous,
                              branch_id: String(branch.id),
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <View style={styles.radioOuter}>
                            {editForm.branch_id === String(branch.id) && (
                              <View style={styles.radioInner} />
                            )}
                          </View>

                          <Text style={styles.optionText}>
                            {branch.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </>
              )}

              {canEditRoleAndBranch && (
                <>
                  <Text style={styles.formSectionTitle}>
                    Account Status
                  </Text>

                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() =>
                      setEditForm((previous) => ({
                        ...previous,
                        is_active: !previous.is_active,
                      }))
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkbox}>
                      {editForm.is_active && (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      )}
                    </View>

                    <Text style={styles.optionText}>
                      Active account
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => void handleUpdateUser()}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#102A43',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102A43',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },
  refreshButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12,
  },
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 13,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    gap: 12,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  username: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeText: {
    color: '#15803D',
  },
  inactiveText: {
    color: '#B91C1C',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 6,
  },
  detailText: {
    color: '#4B5563',
    fontSize: 12,
  },
  globalAdminText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#102A43',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },

  createButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign:'center',
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#102A43',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 18,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102A43',
    marginTop: 18,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#102A43',
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  optionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  checkbox: {
    width: 19,
    height: 19,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '900',
  },
  formErrorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9,
    padding: 11,
    marginBottom: 10,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 110,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
});
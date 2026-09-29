using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class DeptForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource deptBindingSource;

	private DeptTableAdapter deptTableAdapter;

	private BindingNavigator deptBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private SplitContainer splitContainer;

	private TextBox nameTextBox;

	private DataGridView deptDataGridView;

	private NumericUpDown deptIDNumericUpDown;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private Label nameLabel;

	private Label deptIDLabel1;

	public DeptForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "Dept")
		{
			NoCTRowChanged = true;
			eCSDataSet.Dept.Clear();
			deptTableAdapter.Fill(eCSDataSet.Dept);
			deptBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "DeptForm");
	}

	private void DeptForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Dept");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Name");
		deptIDLabel1.Text = Program.GetLang("pw_Number") + ":";
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		Font = Settings.Default.CustomFont;
		if (Program.right == Program.Right.User)
		{
			deptBindingSource.Filter = "DeptID >= " + Settings.Default.minUserDeptID;
		}
		Program.LabelRight_SetXLocaltion(new Label[2] { deptIDLabel1, nameLabel }, new Control[2] { deptIDNumericUpDown, nameTextBox });
		deptTableAdapter.Fill(eCSDataSet.Dept);
		eCSDataSet.Dept.DeptRowChanged += Dept_DeptRowChanged;
	}

	private void Dept_DeptRowChanged(object sender, ECSDataSet.DeptRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.DeptID > Settings.Default.maxDeptID)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.DeptID < Settings.Default.minUserDeptID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			deptTableAdapter.Update(eCSDataSet.Dept);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			deptBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			deptBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				deptTableAdapter.Update(eCSDataSet.Dept);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void DeptForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Dept.DeptRowChanged -= Dept_DeptRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = deptBindingSource.Find("DeptID", bindingNavigatorID.Text);
			if (num != -1)
			{
				deptBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(deptDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					deptBindingSource.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = deptBindingSource;
						bindingSource.Filter = bindingSource.Filter + " AND DeptID >= " + Settings.Default.minUserDeptID;
					}
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		if (Program.right == Program.Right.User)
		{
			deptBindingSource.Filter = "DeptID >= " + Settings.Default.minUserDeptID;
		}
		else
		{
			deptBindingSource.RemoveFilter();
		}
	}

	private void deptDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void deptBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: true, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: true, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void DeptForm_Leave(object sender, EventArgs e)
	{
		deptDataGridView.EndEdit();
		deptBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Dept");
			DataSet_Changed = false;
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in deptDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			deptTableAdapter.Update(eCSDataSet.Dept);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteSelect();
	}

	private void deptDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.DeptForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.deptDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.deptIDLabel1 = new System.Windows.Forms.Label();
		this.deptIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.deptBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.deptTableAdapter = new ECS.ECSDataSetTableAdapters.DeptTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.deptDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deptIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingNavigator).BeginInit();
		this.deptBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.deptDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.deptIDLabel1);
		this.splitContainer.Panel2.Controls.Add(this.deptIDNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.nameLabel);
		this.splitContainer.Panel2.Controls.Add(this.nameTextBox);
		this.deptDataGridView.AllowUserToAddRows = false;
		this.deptDataGridView.AutoGenerateColumns = false;
		this.deptDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.deptDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.deptDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2);
		this.deptDataGridView.DataSource = this.deptBindingSource;
		resources.ApplyResources(this.deptDataGridView, "deptDataGridView");
		this.deptDataGridView.Name = "deptDataGridView";
		this.deptDataGridView.RowTemplate.Height = 23;
		this.deptDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.deptDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(deptDataGridView_DataError);
		this.deptDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(deptDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "DeptID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.deptBindingSource.DataMember = "Dept";
		this.deptBindingSource.DataSource = this.eCSDataSet;
		this.deptBindingSource.Sort = "";
		this.deptBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(deptBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.deptIDLabel1, "deptIDLabel1");
		this.deptIDLabel1.Name = "deptIDLabel1";
		this.deptIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.deptBindingSource, "DeptID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.deptIDNumericUpDown, "deptIDNumericUpDown");
		this.deptIDNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxDeptID;
		this.deptIDNumericUpDown.Name = "deptIDNumericUpDown";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.deptBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.deptBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.deptBindingNavigator.BindingSource = this.deptBindingSource;
		this.deptBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.deptBindingNavigator.DeleteItem = null;
		this.deptBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.deptBindingNavigator, "deptBindingNavigator");
		this.deptBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.deptBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.deptBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.deptBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.deptBindingNavigator.Name = "deptBindingNavigator";
		this.deptBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.deptTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.deptBindingNavigator);
		base.Name = "DeptForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(DeptForm_FormClosing);
		base.Load += new System.EventHandler(DeptForm_Load);
		base.Leave += new System.EventHandler(DeptForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.deptDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deptIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingNavigator).EndInit();
		this.deptBindingNavigator.ResumeLayout(false);
		this.deptBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}

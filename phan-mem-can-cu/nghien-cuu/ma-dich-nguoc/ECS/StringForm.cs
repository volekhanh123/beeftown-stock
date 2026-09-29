using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class StringForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource stringBindingSource;

	private StringTableAdapter stringTableAdapter;

	private BindingNavigator stringBindingNavigator;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private UIDataSet uIDataSet;

	private BindingSource stringInfoBindingSource;

	private DataGridView stringDataGridView;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn Display;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewCheckBoxColumn Valid;

	private ToolStripButton validToolStripButton;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.StringForm));
		this.eCSDataSet = new ECS.ECSDataSet();
		this.stringBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.stringTableAdapter = new ECS.ECSDataSetTableAdapters.StringTableAdapter();
		this.stringBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.validToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.uIDataSet = new ECS.UIDataSet();
		this.stringInfoBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.stringDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Display = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Valid = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stringBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stringBindingNavigator).BeginInit();
		this.stringBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stringInfoBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stringDataGridView).BeginInit();
		base.SuspendLayout();
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.stringBindingSource.DataMember = "String";
		this.stringBindingSource.DataSource = this.eCSDataSet;
		this.stringBindingSource.Filter = "Visible";
		this.stringTableAdapter.ClearBeforeFill = true;
		this.stringBindingNavigator.AddNewItem = null;
		this.stringBindingNavigator.BindingSource = this.stringBindingSource;
		this.stringBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.stringBindingNavigator.DeleteItem = null;
		this.stringBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.toolStripSeparator1, this.validToolStripButton,
			this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.stringBindingNavigator, "stringBindingNavigator");
		this.stringBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.stringBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.stringBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.stringBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.stringBindingNavigator.Name = "stringBindingNavigator";
		this.stringBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
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
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.validToolStripButton.Image = ECS.Properties.Resources.Checkbox;
		resources.ApplyResources(this.validToolStripButton, "validToolStripButton");
		this.validToolStripButton.Name = "validToolStripButton";
		this.validToolStripButton.Click += new System.EventHandler(validToolStripButton_Click);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.stringInfoBindingSource.DataMember = "String_Info";
		this.stringInfoBindingSource.DataSource = this.uIDataSet;
		this.stringInfoBindingSource.Sort = "StringID";
		this.stringDataGridView.AllowUserToAddRows = false;
		this.stringDataGridView.AllowUserToDeleteRows = false;
		this.stringDataGridView.AutoGenerateColumns = false;
		this.stringDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.stringDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.stringDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.Display, this.dataGridViewTextBoxColumn2, this.Valid);
		this.stringDataGridView.DataSource = this.stringBindingSource;
		resources.ApplyResources(this.stringDataGridView, "stringDataGridView");
		this.stringDataGridView.MultiSelect = false;
		this.stringDataGridView.Name = "stringDataGridView";
		this.stringDataGridView.RowTemplate.Height = 23;
		this.stringDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(stringDataGridView_DataError);
		this.stringDataGridView.RowsAdded += new System.Windows.Forms.DataGridViewRowsAddedEventHandler(stringDataGridView_RowsAdded);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "StringID";
		this.dataGridViewTextBoxColumn1.FillWeight = 10f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn1.ReadOnly = true;
		this.Display.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Display.FillWeight = 50f;
		resources.ApplyResources(this.Display, "Display");
		this.Display.Name = "Display";
		this.Display.ReadOnly = true;
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Value";
		this.dataGridViewTextBoxColumn2.FillWeight = 30f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.Valid.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Valid.DataPropertyName = "Valid";
		this.Valid.FillWeight = 10f;
		resources.ApplyResources(this.Valid, "Valid");
		this.Valid.Name = "Valid";
		this.Valid.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.stringDataGridView);
		base.Controls.Add(this.stringBindingNavigator);
		base.Name = "StringForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(StringForm_FormClosing);
		base.Load += new System.EventHandler(StringForm_Load);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stringBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stringBindingNavigator).EndInit();
		this.stringBindingNavigator.ResumeLayout(false);
		this.stringBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stringInfoBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stringDataGridView).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public StringForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "String")
		{
			eCSDataSet.String.Clear();
			stringTableAdapter.Fill(eCSDataSet.String);
			stringBindingSource.ResetBindings(metadataChanged: false);
		}
	}

	private void StringForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_GlobalText");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Value");
		Display.HeaderText = Program.GetLang("pw_Description");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		Valid.HeaderText = Program.GetLang("pw_Import_Export");
		validToolStripButton.Text = Program.GetLang("pw_Import_ExportAll");
		Font = Settings.Default.CustomFont;
		ToolStripButton toolStripButton = validToolStripButton;
		bool visible = (toolStripSeparator1.Visible = Program.right == Program.Right.SuperAdmin);
		toolStripButton.Visible = visible;
		string fileName = Application.StartupPath + "\\Tm.xml";
		uIDataSet.String_Info.ReadXml(fileName);
		stringTableAdapter.Fill(eCSDataSet.String);
		foreach (ECSDataSet.StringRow item in eCSDataSet.String)
		{
			item.BeginEdit();
			item.Visible = GetVisible(item.StringID);
			if (!item.Visible)
			{
				item.Valid = false;
			}
			item.EndEdit();
		}
		try
		{
			stringTableAdapter.Update(eCSDataSet.String);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private UIDataSet.String_InfoRow GetInfoRow(int stringID)
	{
		int num = stringInfoBindingSource.Find("StringID", stringID);
		if (num > -1)
		{
			DataRowView dataRowView = (DataRowView)stringInfoBindingSource[num];
			return (UIDataSet.String_InfoRow)dataRowView.Row;
		}
		return null;
	}

	private bool GetVisible(int id)
	{
		int num = stringInfoBindingSource.Find("StringID", id);
		if (num == -1)
		{
			return false;
		}
		DataRowView dataRowView = (DataRowView)stringInfoBindingSource[num];
		UIDataSet.String_InfoRow string_InfoRow = (UIDataSet.String_InfoRow)dataRowView.Row;
		if (Program.right == Program.Right.SuperAdmin)
		{
			return true;
		}
		if (Program.right == Program.Right.Admin)
		{
			if (!(string_InfoRow.Visible.ToLower() == "true"))
			{
				return string_InfoRow.Visible.ToLower() == "admin";
			}
			return true;
		}
		return string_InfoRow.Visible.ToLower() == "true";
	}

	private string GetDisplay(int id)
	{
		int num = stringInfoBindingSource.Find("StringID", id);
		if (num == -1)
		{
			return string.Empty;
		}
		DataRowView dataRowView = (DataRowView)stringInfoBindingSource[num];
		UIDataSet.String_InfoRow string_InfoRow = (UIDataSet.String_InfoRow)dataRowView.Row;
		return string_InfoRow.Display;
	}

	public void SaveData()
	{
		Validate();
		try
		{
			stringBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			stringBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				stringTableAdapter.Update(eCSDataSet.String);
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void StringForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		SaveData();
	}

	private void stringDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void stringDataGridView_RowsAdded(object sender, DataGridViewRowsAddedEventArgs e)
	{
		for (int i = e.RowIndex; i < e.RowIndex + e.RowCount; i++)
		{
			int id = (int)stringDataGridView[0, i].Value;
			if (!GetVisible(id))
			{
				stringDataGridView.Rows[i].Visible = false;
			}
			else
			{
				stringDataGridView[1, i].Value = GetDisplay(id);
			}
		}
	}

	private void validToolStripButton_Click(object sender, EventArgs e)
	{
		bool flag = !validToolStripButton.Checked;
		validToolStripButton.Checked = flag;
		foreach (DataRowView item in stringBindingSource)
		{
			ECSDataSet.StringRow stringRow = (ECSDataSet.StringRow)item.Row;
			stringRow.Valid = flag;
		}
		try
		{
			stringTableAdapter.Update(eCSDataSet.String);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: true, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: true, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}
}

using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class AutoTaskForm : Form
{
	private IContainer components;

	private UIDataSet uiDataSet;

	private BindingSource network_AutoBindingSource;

	private BindingNavigator network_AutoBindingNavigator;

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

	private BindingSource network_DueBindingSource;

	private BindingSource network_TaskBindingSource;

	private DataGridView network_AutoDataGridView;

	private SplitContainer splitContainer;

	private DateTimePicker dueTimePicker;

	private DateTimePicker dueDatePicker;

	private ComboBox taskComboBox;

	private ComboBox dueComboBox;

	private CheckBox repeatCheckBox;

	private NumericUpDown dayNumericUpDown;

	private NumericUpDown hourNumericUpDown;

	private NumericUpDown minuteNumericUpDown;

	private NumericUpDown secondNumericUpDown;

	private DataGridViewComboBoxColumn taskColumn;

	private DataGridViewComboBoxColumn dueColumn;

	private DataGridViewCheckBoxColumn repeatColumn;

	private DataGridViewTextBoxColumn idColumn;

	private GroupBox uriGroupBox;

	private TextBox uriTextBox;

	private TextBox passwordTextBox;

	private CheckBox logCheckBox;

	private TextBox usernameTextBox;

	private ComboBox fileComboBox;

	private Label passowrdLabel;

	private Label usernameLabel;

	private Label secondLabel;

	private Label taskLabel;

	private Label dueLabel;

	private Label dateTimeLabel;

	private Label dayLabel;

	private Label hourLabel;

	private Label minuteLabel;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.AutoTaskForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.network_AutoDataGridView = new System.Windows.Forms.DataGridView();
		this.taskColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.network_TaskBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.dueColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.network_DueBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.repeatColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.idColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.network_AutoBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uriGroupBox = new System.Windows.Forms.GroupBox();
		this.fileComboBox = new System.Windows.Forms.ComboBox();
		this.passowrdLabel = new System.Windows.Forms.Label();
		this.usernameLabel = new System.Windows.Forms.Label();
		this.uriTextBox = new System.Windows.Forms.TextBox();
		this.passwordTextBox = new System.Windows.Forms.TextBox();
		this.logCheckBox = new System.Windows.Forms.CheckBox();
		this.usernameTextBox = new System.Windows.Forms.TextBox();
		this.secondLabel = new System.Windows.Forms.Label();
		this.secondNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.taskLabel = new System.Windows.Forms.Label();
		this.taskComboBox = new System.Windows.Forms.ComboBox();
		this.dueLabel = new System.Windows.Forms.Label();
		this.dueComboBox = new System.Windows.Forms.ComboBox();
		this.dateTimeLabel = new System.Windows.Forms.Label();
		this.repeatCheckBox = new System.Windows.Forms.CheckBox();
		this.dayLabel = new System.Windows.Forms.Label();
		this.dayNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.hourLabel = new System.Windows.Forms.Label();
		this.hourNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.minuteLabel = new System.Windows.Forms.Label();
		this.minuteNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.dueTimePicker = new System.Windows.Forms.DateTimePicker();
		this.dueDatePicker = new System.Windows.Forms.DateTimePicker();
		this.network_AutoBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.network_AutoDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.network_TaskBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.network_DueBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.network_AutoBindingSource).BeginInit();
		this.uriGroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.secondNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.dayNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.hourNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.minuteNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.network_AutoBindingNavigator).BeginInit();
		this.network_AutoBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		this.splitContainer.Panel1.Controls.Add(this.network_AutoDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.uriGroupBox);
		this.splitContainer.Panel2.Controls.Add(this.secondLabel);
		this.splitContainer.Panel2.Controls.Add(this.secondNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.taskLabel);
		this.splitContainer.Panel2.Controls.Add(this.taskComboBox);
		this.splitContainer.Panel2.Controls.Add(this.dueLabel);
		this.splitContainer.Panel2.Controls.Add(this.dueComboBox);
		this.splitContainer.Panel2.Controls.Add(this.dateTimeLabel);
		this.splitContainer.Panel2.Controls.Add(this.repeatCheckBox);
		this.splitContainer.Panel2.Controls.Add(this.dayLabel);
		this.splitContainer.Panel2.Controls.Add(this.dayNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.hourLabel);
		this.splitContainer.Panel2.Controls.Add(this.hourNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.minuteLabel);
		this.splitContainer.Panel2.Controls.Add(this.minuteNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.dueTimePicker);
		this.splitContainer.Panel2.Controls.Add(this.dueDatePicker);
		this.network_AutoDataGridView.AllowUserToAddRows = false;
		this.network_AutoDataGridView.AutoGenerateColumns = false;
		this.network_AutoDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.network_AutoDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.network_AutoDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.network_AutoDataGridView.Columns.AddRange(this.taskColumn, this.dueColumn, this.repeatColumn, this.idColumn);
		this.network_AutoDataGridView.DataSource = this.network_AutoBindingSource;
		resources.ApplyResources(this.network_AutoDataGridView, "network_AutoDataGridView");
		this.network_AutoDataGridView.Name = "network_AutoDataGridView";
		this.network_AutoDataGridView.RowTemplate.Height = 23;
		this.network_AutoDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.network_AutoDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(network_AutoDataGridView_DataError);
		this.taskColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.taskColumn.DataPropertyName = "Task";
		this.taskColumn.DataSource = this.network_TaskBindingSource;
		this.taskColumn.DisplayMember = "Display";
		resources.ApplyResources(this.taskColumn, "taskColumn");
		this.taskColumn.Name = "taskColumn";
		this.taskColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.taskColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.taskColumn.ValueMember = "Value";
		this.network_TaskBindingSource.DataMember = "Network_Task";
		this.network_TaskBindingSource.DataSource = this.uiDataSet;
		this.network_TaskBindingSource.Filter = "[Value] <> 2";
		this.network_TaskBindingSource.Sort = "Value";
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.dueColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dueColumn.DataPropertyName = "Due";
		this.dueColumn.DataSource = this.network_DueBindingSource;
		this.dueColumn.DisplayMember = "Display";
		resources.ApplyResources(this.dueColumn, "dueColumn");
		this.dueColumn.Name = "dueColumn";
		this.dueColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dueColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dueColumn.ValueMember = "Value";
		this.network_DueBindingSource.DataMember = "Network_Due";
		this.network_DueBindingSource.DataSource = this.uiDataSet;
		this.network_DueBindingSource.Sort = "Value";
		this.repeatColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.repeatColumn.DataPropertyName = "Repeat";
		resources.ApplyResources(this.repeatColumn, "repeatColumn");
		this.repeatColumn.Name = "repeatColumn";
		this.idColumn.DataPropertyName = "ID";
		resources.ApplyResources(this.idColumn, "idColumn");
		this.idColumn.Name = "idColumn";
		this.network_AutoBindingSource.DataMember = "Network_Auto";
		this.network_AutoBindingSource.DataSource = this.uiDataSet;
		this.network_AutoBindingSource.Sort = "ID";
		this.network_AutoBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(network_AutoBindingSource_BindingComplete);
		this.network_AutoBindingSource.CurrentItemChanged += new System.EventHandler(network_AutoBindingSource_CurrentItemChanged);
		this.uriGroupBox.Controls.Add(this.fileComboBox);
		this.uriGroupBox.Controls.Add(this.passowrdLabel);
		this.uriGroupBox.Controls.Add(this.usernameLabel);
		this.uriGroupBox.Controls.Add(this.uriTextBox);
		this.uriGroupBox.Controls.Add(this.passwordTextBox);
		this.uriGroupBox.Controls.Add(this.logCheckBox);
		this.uriGroupBox.Controls.Add(this.usernameTextBox);
		resources.ApplyResources(this.uriGroupBox, "uriGroupBox");
		this.uriGroupBox.Name = "uriGroupBox";
		this.uriGroupBox.TabStop = false;
		this.fileComboBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.network_AutoBindingSource, "File", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.fileComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fileComboBox.FormattingEnabled = true;
		this.fileComboBox.Items.AddRange(new object[2]
		{
			resources.GetString("fileComboBox.Items"),
			resources.GetString("fileComboBox.Items1")
		});
		resources.ApplyResources(this.fileComboBox, "fileComboBox");
		this.fileComboBox.Name = "fileComboBox";
		resources.ApplyResources(this.passowrdLabel, "passowrdLabel");
		this.passowrdLabel.Name = "passowrdLabel";
		resources.ApplyResources(this.usernameLabel, "usernameLabel");
		this.usernameLabel.Name = "usernameLabel";
		this.uriTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.network_AutoBindingSource, "Uri", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.uriTextBox, "uriTextBox");
		this.uriTextBox.Name = "uriTextBox";
		this.passwordTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.network_AutoBindingSource, "Password", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.passwordTextBox, "passwordTextBox");
		this.passwordTextBox.Name = "passwordTextBox";
		resources.ApplyResources(this.logCheckBox, "logCheckBox");
		this.logCheckBox.DataBindings.Add(new System.Windows.Forms.Binding("CheckState", this.network_AutoBindingSource, "Login", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.logCheckBox.Name = "logCheckBox";
		this.logCheckBox.UseVisualStyleBackColor = true;
		this.usernameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.network_AutoBindingSource, "User", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.usernameTextBox, "usernameTextBox");
		this.usernameTextBox.Name = "usernameTextBox";
		resources.ApplyResources(this.secondLabel, "secondLabel");
		this.secondLabel.Name = "secondLabel";
		this.secondNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "Second", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.secondNumericUpDown, "secondNumericUpDown");
		this.secondNumericUpDown.Maximum = new decimal(new int[4] { 59, 0, 0, 0 });
		this.secondNumericUpDown.Name = "secondNumericUpDown";
		resources.ApplyResources(this.taskLabel, "taskLabel");
		this.taskLabel.Name = "taskLabel";
		this.taskComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.network_AutoBindingSource, "Task", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.taskComboBox.DataSource = this.network_TaskBindingSource;
		this.taskComboBox.DisplayMember = "Display";
		this.taskComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.taskComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.taskComboBox, "taskComboBox");
		this.taskComboBox.Name = "taskComboBox";
		this.taskComboBox.ValueMember = "Value";
		resources.ApplyResources(this.dueLabel, "dueLabel");
		this.dueLabel.Name = "dueLabel";
		this.dueComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.network_AutoBindingSource, "Due", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dueComboBox.DataSource = this.network_DueBindingSource;
		this.dueComboBox.DisplayMember = "Display";
		this.dueComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.dueComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.dueComboBox, "dueComboBox");
		this.dueComboBox.Name = "dueComboBox";
		this.dueComboBox.ValueMember = "Value";
		resources.ApplyResources(this.dateTimeLabel, "dateTimeLabel");
		this.dateTimeLabel.Name = "dateTimeLabel";
		this.repeatCheckBox.DataBindings.Add(new System.Windows.Forms.Binding("CheckState", this.network_AutoBindingSource, "Repeat", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.repeatCheckBox, "repeatCheckBox");
		this.repeatCheckBox.Name = "repeatCheckBox";
		this.repeatCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.dayLabel, "dayLabel");
		this.dayLabel.Name = "dayLabel";
		this.dayNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "Day", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.dayNumericUpDown, "dayNumericUpDown");
		this.dayNumericUpDown.Maximum = new decimal(new int[4] { 30, 0, 0, 0 });
		this.dayNumericUpDown.Name = "dayNumericUpDown";
		resources.ApplyResources(this.hourLabel, "hourLabel");
		this.hourLabel.Name = "hourLabel";
		this.hourNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "Hour", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.hourNumericUpDown, "hourNumericUpDown");
		this.hourNumericUpDown.Maximum = new decimal(new int[4] { 23, 0, 0, 0 });
		this.hourNumericUpDown.Name = "hourNumericUpDown";
		resources.ApplyResources(this.minuteLabel, "minuteLabel");
		this.minuteLabel.Name = "minuteLabel";
		this.minuteNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "Minute", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.minuteNumericUpDown, "minuteNumericUpDown");
		this.minuteNumericUpDown.Maximum = new decimal(new int[4] { 59, 0, 0, 0 });
		this.minuteNumericUpDown.Name = "minuteNumericUpDown";
		this.dueTimePicker.Checked = false;
		this.dueTimePicker.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "DateTime", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dueTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		resources.ApplyResources(this.dueTimePicker, "dueTimePicker");
		this.dueTimePicker.Name = "dueTimePicker";
		this.dueTimePicker.ShowUpDown = true;
		this.dueDatePicker.Checked = false;
		this.dueDatePicker.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.network_AutoBindingSource, "DateTime", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dueDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		resources.ApplyResources(this.dueDatePicker, "dueDatePicker");
		this.dueDatePicker.Name = "dueDatePicker";
		this.network_AutoBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.network_AutoBindingNavigator.BindingSource = this.network_AutoBindingSource;
		this.network_AutoBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.network_AutoBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.network_AutoBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem
		});
		resources.ApplyResources(this.network_AutoBindingNavigator, "network_AutoBindingNavigator");
		this.network_AutoBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.network_AutoBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.network_AutoBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.network_AutoBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.network_AutoBindingNavigator.Name = "network_AutoBindingNavigator";
		this.network_AutoBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.network_AutoBindingNavigator);
		base.Name = "AutoTaskForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(AutoTaskForm_FormClosed);
		base.Load += new System.EventHandler(AutoTaskForm_Load);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.network_AutoDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.network_TaskBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.network_DueBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.network_AutoBindingSource).EndInit();
		this.uriGroupBox.ResumeLayout(false);
		this.uriGroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.secondNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.dayNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.hourNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.minuteNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.network_AutoBindingNavigator).EndInit();
		this.network_AutoBindingNavigator.ResumeLayout(false);
		this.network_AutoBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public AutoTaskForm()
	{
		InitializeComponent();
	}

	private void AutoTaskForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_AutoTask");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		dateTimeLabel.Text = Program.GetLang("pw_DateTime") + ":";
		dayLabel.Text = Program.GetLang("pw_Day_sl_");
		dueColumn.HeaderText = Program.GetLang("pw_Start");
		dueLabel.Text = Program.GetLang("pw_Start") + ":";
		hourLabel.Text = Program.GetLang("pw_Hour") + ":";
		logCheckBox.Text = Program.GetLang("pw_Login");
		minuteLabel.Text = Program.GetLang("pw_Minute") + ":";
		passowrdLabel.Text = Program.GetLang("pw_Passowrd");
		repeatCheckBox.Text = Program.GetLang("pw_Repeat");
		repeatColumn.HeaderText = Program.GetLang("pw_Repeat");
		secondLabel.Text = Program.GetLang("pw_Second") + ":";
		taskColumn.HeaderText = Program.GetLang("pw_Task");
		taskLabel.Text = Program.GetLang("pw_Task") + ":";
		uriGroupBox.Text = Program.GetLang("pw_Uri");
		usernameLabel.Text = Program.GetLang("pw_UserName");
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.Network_Due.ReadXml(fileName);
		uiDataSet.Network_Task.ReadXml(fileName);
		fileName = Application.StartupPath + "\\AutoTask.xml";
		if (File.Exists(fileName))
		{
			uiDataSet.Network_Auto.ReadXml(fileName);
		}
		UpdateUI();
	}

	private void AutoTaskForm_FormClosed(object sender, FormClosedEventArgs e)
	{
		Select(directed: true, forward: true);
		Validate();
		try
		{
			network_AutoBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			network_AutoBindingSource.CancelEdit();
		}
		if (uiDataSet.HasChanges())
		{
			string fileName = Application.StartupPath + "\\AutoTask.xml";
			uiDataSet.Network_Auto.WriteXml(fileName);
		}
	}

	private void network_AutoDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void UpdateUI()
	{
		int num = 0;
		if (dueComboBox.SelectedIndex != -1)
		{
			num = (int)dueComboBox.SelectedValue;
		}
		DateTimePicker dateTimePicker = dueDatePicker;
		bool enabled = (dueTimePicker.Enabled = num == 1);
		dateTimePicker.Enabled = enabled;
		repeatCheckBox.Enabled = num != 2;
		if (num == 2)
		{
			repeatCheckBox.Checked = false;
		}
		NumericUpDown numericUpDown = dayNumericUpDown;
		NumericUpDown numericUpDown2 = hourNumericUpDown;
		NumericUpDown numericUpDown3 = minuteNumericUpDown;
		bool flag2 = (secondNumericUpDown.Enabled = repeatCheckBox.Checked);
		bool flag4 = (numericUpDown3.Enabled = flag2);
		bool enabled2 = (numericUpDown2.Enabled = flag4);
		numericUpDown.Enabled = enabled2;
		int num2 = 0;
		if (taskComboBox.SelectedIndex != -1)
		{
			num2 = (int)taskComboBox.SelectedValue;
		}
		uriGroupBox.Enabled = num2 == 8 || num2 == 9;
		TextBox textBox = usernameTextBox;
		bool enabled3 = (passwordTextBox.Enabled = logCheckBox.Checked);
		textBox.Enabled = enabled3;
	}

	private void network_AutoBindingSource_CurrentItemChanged(object sender, EventArgs e)
	{
		UpdateUI();
	}

	private void network_AutoBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
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
}
